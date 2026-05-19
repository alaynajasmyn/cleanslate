import type { Subscription, BillingCadence } from '@cleanslate/shared';

const FACTOR: Record<BillingCadence, number> = {
  daily: 365,
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  biannual: 2,
  annual: 1,
  irregular: 6, // assume rough monthly equivalent
};

/**
 * Annualized cost of a subscription.
 */
export function annualizedCost(s: Pick<Subscription, 'amount' | 'cadence'>): number {
  return Number((s.amount * FACTOR[s.cadence]).toFixed(2));
}

/**
 * If the user cancels now, how much they save before the next renewal date or annual cycle.
 */
export function expectedSavings(s: Subscription, horizonDays = 365): number {
  const annual = annualizedCost(s);
  const ratio = horizonDays / 365;
  return Number((annual * ratio).toFixed(2));
}

/**
 * Group subs into "you can cut these without noticing" buckets — sorted by cost desc.
 */
export function rankCutCandidates(subs: Subscription[]): Array<Subscription & { annualUsd: number }> {
  return subs
    .filter((s) => s.status === 'active')
    .map((s) => ({ ...s, annualUsd: annualizedCost(s) }))
    .sort((a, b) => b.annualUsd - a.annualUsd);
}
