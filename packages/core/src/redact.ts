/**
 * PII redaction. Runs locally before any LLM call.
 * Pattern-based; not bulletproof, but enough to keep emails / phones / cards out of prompts.
 */

const PATTERNS: Array<[RegExp, string]> = [
  // Email — matched first so it isn't eaten by other patterns
  [/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[EMAIL]'],
  // URL credentials
  [/([?&])(token|key|password|secret|api[_-]?key)=([^&\s]+)/gi, '$1$2=[REDACTED]'],
  // SSN (US) — narrow form, run before generic digit grabbers
  [/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]'],
  // IBAN — country prefix avoids collision
  [/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g, '[IBAN]'],
  // Phone with explicit + country prefix (e.g. +62 812-3456-7890) — must match
  // before the card regex so phone digits aren't swallowed.
  [/\+\d[\d\s().-]{5,18}\d/g, '[PHONE]'],
  // Card: 13-19 digits with optional spaces or dashes (no leading +)
  [/(?<![\d+])(?:\d[ -]*?){13,19}(?!\d)/g, '[CARD]'],
  // KTP / NIK Indonesia — exact 16-digit block
  [/(?<!\d)\d{16}(?!\d)/g, '[NATIONAL_ID]'],
  // Local-format phone (no +): 7+ digits with separators, anchored
  [/(?<!\d)(\d[\d\s().-]{6,14}\d)(?!\d)/g, '[PHONE]'],
];

export function redact(text: string): string {
  let out = text;
  for (const [re, replacement] of PATTERNS) out = out.replace(re, replacement);
  return out;
}

export function redactObject<T>(obj: T, depth = 4): T {
  if (depth <= 0 || obj == null) return obj;
  if (typeof obj === 'string') return redact(obj) as unknown as T;
  if (Array.isArray(obj)) return (obj.map((x) => redactObject(x, depth - 1)) as unknown) as T;
  if (typeof obj === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      o[k] = redactObject(v, depth - 1);
    }
    return o as T;
  }
  return obj;
}
