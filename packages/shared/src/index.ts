import { z } from 'zod';

/* ─────────── Money ─────────── */

export const CurrencySchema = z.enum(['USD', 'EUR', 'GBP', 'IDR', 'SGD', 'JPY', 'AUD', 'CAD']);
export type Currency = z.infer<typeof CurrencySchema>;

/* ─────────── Source ─────────── */

export const SourceTypeSchema = z.enum(['gmail', 'imap', 'plaid', 'brick', 'csv', 'manual']);
export type SourceType = z.infer<typeof SourceTypeSchema>;

/* ─────────── Subscription ─────────── */

export const BillingCadenceSchema = z.enum([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'biannual',
  'annual',
  'irregular',
]);
export type BillingCadence = z.infer<typeof BillingCadenceSchema>;

export const SubscriptionStatusSchema = z.enum([
  'active',
  'trial',
  'paused',
  'canceled',
  'unknown',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  vendor: z.string().min(1),
  vendorDomain: z.string().nullable(),
  category: z.string().nullable(),
  amount: z.number(),
  currency: CurrencySchema,
  cadence: BillingCadenceSchema,
  status: SubscriptionStatusSchema,
  trialEndsAt: z.string().datetime().nullable(),
  nextChargeAt: z.string().datetime().nullable(),
  lastSeenAt: z.string().datetime(),
  detectedFrom: SourceTypeSchema,
  confidence: z.number().min(0).max(1),
  notes: z.string().nullable(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

/* ─────────── Anomaly / Action ─────────── */

export const AnomalySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  kind: z.enum(['price_hike', 'duplicate_charge', 'unused_subscription', 'trial_ending', 'unusual_amount']),
  severity: z.enum(['info', 'warn', 'critical']),
  subject: z.string(),
  detail: z.string(),
  meta: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
});
export type Anomaly = z.infer<typeof AnomalySchema>;

export const ActionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  kind: z.enum(['cancel', 'downgrade', 'negotiate', 'snooze', 'tag']),
  subscriptionId: z.string().uuid().nullable(),
  status: z.enum(['suggested', 'approved', 'sent', 'completed', 'rejected']),
  draftBody: z.string().nullable(),
  channel: z.enum(['email', 'web', 'phone', 'manual']).nullable(),
  expectedSavingsUsd: z.number().nullable(),
  meta: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
});
export type Action = z.infer<typeof ActionSchema>;

/* ─────────── Charge / Email ─────────── */

export const ChargeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  sourceType: SourceTypeSchema,
  sourceRef: z.string(),
  occurredAt: z.string().datetime(),
  amount: z.number(),
  currency: CurrencySchema,
  rawDescriptor: z.string(),
  normalizedVendor: z.string().nullable(),
  subscriptionId: z.string().uuid().nullable(),
});
export type Charge = z.infer<typeof ChargeSchema>;

export const EmailRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  messageId: z.string(),
  from: z.string(),
  subject: z.string(),
  receivedAt: z.string().datetime(),
  redactedSnippet: z.string(),
  classified: z.enum(['receipt', 'renewal', 'price_hike', 'trial_end', 'cancel_confirm', 'other']),
  vendorGuess: z.string().nullable(),
  amountGuess: z.number().nullable(),
});
export type EmailRecord = z.infer<typeof EmailRecordSchema>;

/* ─────────── Errors ─────────── */

export class CleanslateError extends Error {
  constructor(public code: string, message: string, public cause?: unknown) {
    super(message);
    this.name = 'CleanslateError';
  }
}
