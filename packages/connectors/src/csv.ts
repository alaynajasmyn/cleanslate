/**
 * Bank charge import via CSV. Universal — works for BCA, BRI, Mandiri, Chase, etc.
 * User uploads exported statement; connector normalizes to Charge[].
 *
 * Heuristics:
 *  - autodetect column headers (case-insensitive synonyms)
 *  - infer currency from amount sign + locale separators
 *  - skip CR/credits unless flagged
 */

import type { Charge, Currency } from '@cleanslate/shared';

const HEADER_SYNONYMS = {
  date: ['date', 'tanggal', 'transaction date', 'posting date', 'tgl'],
  description: ['description', 'descriptor', 'merchant', 'keterangan', 'memo', 'narrative'],
  amount: ['amount', 'jumlah', 'debit', 'value', 'nominal'],
  currency: ['currency', 'curr', 'mata uang'],
};

function toIsoDate(s: string): string | null {
  // Try ISO first
  const iso = Date.parse(s);
  if (!isNaN(iso)) return new Date(iso).toISOString();
  // Common formats: dd/mm/yyyy, dd-mm-yyyy, yyyy.mm.dd
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = '20' + y;
    const dt = new Date(`${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(+dt)) return dt.toISOString();
  }
  return null;
}

function parseAmount(raw: string): number | null {
  const s = raw.trim().replace(/[^\d,.\-]/g, '');
  if (!s) return null;
  // Indonesian / European decimal: 99.000,50  → strip dots, comma is decimal
  if (/,\d{1,2}$/.test(s)) {
    const n = Number(s.replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  // US-style: 1,234.50
  const n = Number(s.replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function findCol(headers: string[], synonyms: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const syn of synonyms) {
    const i = lower.indexOf(syn);
    if (i >= 0) return i;
  }
  // partial match
  for (let i = 0; i < lower.length; i++) {
    if (synonyms.some((s) => lower[i].includes(s))) return i;
  }
  return -1;
}

export interface CsvImportOpts {
  defaultCurrency?: Currency;
  userId: string;
  sourceRefPrefix?: string;
}

export function parseCsv(text: string, opts: CsvImportOpts): Omit<Charge, 'id'>[] {
  const rows = text.split(/\r?\n/).filter(Boolean).map((r) => parseCsvLine(r));
  if (rows.length < 2) return [];
  const headers = rows[0];
  const dateCol = findCol(headers, HEADER_SYNONYMS.date);
  const descCol = findCol(headers, HEADER_SYNONYMS.description);
  const amtCol = findCol(headers, HEADER_SYNONYMS.amount);
  const curCol = findCol(headers, HEADER_SYNONYMS.currency);
  if (dateCol < 0 || descCol < 0 || amtCol < 0) {
    throw new Error('CSV is missing required columns (date, description, amount)');
  }

  const out: Omit<Charge, 'id'>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const occurredAt = toIsoDate(r[dateCol] ?? '');
    const amount = parseAmount(r[amtCol] ?? '');
    const desc = (r[descCol] ?? '').trim();
    const currency = (curCol >= 0 ? r[curCol] : opts.defaultCurrency ?? 'USD') as Currency;
    if (!occurredAt || amount === null || !desc) continue;
    if (amount <= 0) continue; // skip credits / refunds
    out.push({
      userId: opts.userId,
      sourceType: 'csv',
      sourceRef: `${opts.sourceRefPrefix ?? 'csv'}:${i}:${occurredAt}:${desc.slice(0, 60)}`,
      occurredAt,
      amount: Math.abs(amount),
      currency,
      rawDescriptor: desc,
      normalizedVendor: normalizeVendor(desc),
      subscriptionId: null,
    });
  }
  return out;
}

function parseCsvLine(line: string): string[] {
  // Tiny CSV parser with quote support
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

export function normalizeVendor(descriptor: string): string {
  return descriptor
    .toUpperCase()
    .replace(/\s{2,}/g, ' ')
    .replace(/\b(POS|DEBIT|CREDIT|PURCHASE|PAYMENT|RECURRING|AUTOPAY|TRANSFER|FEE|SQ \*|TST\*)\b/g, '')
    .replace(/\b\d{4,}\b/g, '') // strip ref numbers
    .replace(/[^\w &.-]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ')
    .trim();
}
