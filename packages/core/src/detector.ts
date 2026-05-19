/**
 * Subscription detector. Pure functions — given a list of charges, find recurring patterns.
 * Used by both bank-scan and email-scan workers.
 */

import type { Charge, BillingCadence, Subscription } from '@cleanslate/shared';

interface Candidate {
  vendor: string;
  amounts: number[];
  intervalsDays: number[];
  charges: Charge[];
}

function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
}

function groupByVendor(charges: Charge[]): Map<string, Charge[]> {
  const m = new Map<string, Charge[]>();
  for (const c of charges) {
    const v = (c.normalizedVendor || c.rawDescriptor).toUpperCase().trim();
    const arr = m.get(v) ?? [];
    arr.push(c);
    m.set(v, arr);
  }
  return m;
}

function inferCadence(intervals: number[]): { cadence: BillingCadence; confidence: number } {
  if (intervals.length === 0) return { cadence: 'irregular', confidence: 0 };
  const median = intervals.slice().sort((a, b) => a - b)[Math.floor(intervals.length / 2)];
  const within = (target: number, tol: number) => Math.abs(median - target) <= tol;
  if (within(1, 0.5)) return { cadence: 'daily', confidence: 0.8 };
  if (within(7, 1.5)) return { cadence: 'weekly', confidence: 0.85 };
  if (within(14, 2)) return { cadence: 'biweekly', confidence: 0.85 };
  if (within(30, 4)) return { cadence: 'monthly', confidence: 0.95 };
  if (within(91, 7)) return { cadence: 'quarterly', confidence: 0.9 };
  if (within(182, 14)) return { cadence: 'biannual', confidence: 0.9 };
  if (within(365, 21)) return { cadence: 'annual', confidence: 0.95 };
  return { cadence: 'irregular', confidence: 0.4 };
}

export interface Detection {
  vendor: string;
  amount: number;
  cadence: BillingCadence;
  confidence: number;
  charges: Charge[];
  nextChargeAt: string | null;
}

export function detectSubscriptions(charges: Charge[], opts: { minOccurrences?: number } = {}): Detection[] {
  const minOccurrences = opts.minOccurrences ?? 2;
  const grouped = groupByVendor(charges);
  const out: Detection[] = [];

  for (const [vendor, list] of grouped) {
    if (list.length < minOccurrences) continue;
    list.sort((a, b) => +new Date(a.occurredAt) - +new Date(b.occurredAt));

    const intervals: number[] = [];
    for (let i = 1; i < list.length; i++) intervals.push(daysBetween(list[i].occurredAt, list[i - 1].occurredAt));

    const { cadence, confidence: cadenceConf } = inferCadence(intervals);
    if (cadence === 'irregular' && cadenceConf < 0.5) continue;

    const amounts = list.map((c) => c.amount);
    const last = list[list.length - 1];
    const median = amounts.slice().sort((a, b) => a - b)[Math.floor(amounts.length / 2)];

    // Amount stability — penalize wild swings (utilities have variance, treat separately)
    const variance =
      amounts.reduce((s, a) => s + (a - median) ** 2, 0) / amounts.length;
    const stable = variance / median ** 2 < 0.05; // CV² < 5%
    const confidence = Math.min(1, (stable ? cadenceConf : cadenceConf - 0.2) * (list.length >= 3 ? 1 : 0.85));

    let nextChargeAt: string | null = null;
    if (cadence !== 'irregular') {
      const intervalDays = { daily: 1, weekly: 7, biweekly: 14, monthly: 30, quarterly: 91, biannual: 182, annual: 365 }[cadence as Exclude<BillingCadence, 'irregular'>];
      nextChargeAt = new Date(+new Date(last.occurredAt) + intervalDays * 86_400_000).toISOString();
    }

    out.push({ vendor, amount: median, cadence, confidence, charges: list, nextChargeAt });
  }

  return out.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Anomaly: price hike. Compare median of last 6 months vs latest charge.
 */
export function detectPriceHike(sub: Subscription, charges: Charge[]): { hikePct: number; from: number; to: number } | null {
  if (charges.length < 3) return null;
  const sorted = charges.slice().sort((a, b) => +new Date(a.occurredAt) - +new Date(b.occurredAt));
  const last = sorted[sorted.length - 1];
  const prior = sorted.slice(0, -1);
  const baseline = prior.map((c) => c.amount).sort((a, b) => a - b)[Math.floor(prior.length / 2)];
  const hikePct = ((last.amount - baseline) / baseline) * 100;
  if (hikePct < 8) return null;
  return { hikePct: Number(hikePct.toFixed(2)), from: baseline, to: last.amount };
}

/**
 * Anomaly: trial ending. Subscription with status='trial' and trialEndsAt within N days.
 */
export function detectTrialEnding(subs: Subscription[], withinDays = 3): Subscription[] {
  const cutoff = Date.now() + withinDays * 86_400_000;
  return subs.filter(
    (s) => s.status === 'trial' && s.trialEndsAt && +new Date(s.trialEndsAt) <= cutoff,
  );
}

/**
 * Anomaly: unused subscription. No usage signal in N days (must be supplied via meta.lastUsedAt).
 */
export function detectUnused(subs: Subscription[], days = 90): Subscription[] {
  const cutoff = Date.now() - days * 86_400_000;
  return subs.filter((s) => {
    const lastUsed = s.notes ? null : null; // hook: replace with usage signal source
    if (!lastUsed) return false;
    return +new Date(lastUsed) < cutoff;
  });
}
