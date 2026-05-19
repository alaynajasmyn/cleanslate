import { describe, expect, test } from 'bun:test';
import { detectSubscriptions, detectPriceHike } from '../packages/core/src/detector.ts';
import { redact } from '../packages/core/src/redact.ts';

const charges = (vendor: string, amounts: number[], startDays: number, intervalDays: number) =>
  amounts.map((amount, i) => ({
    id: `c${i}`,
    userId: 'u1',
    sourceType: 'csv' as const,
    sourceRef: `${vendor}-${i}`,
    occurredAt: new Date(Date.now() - (startDays - i * intervalDays) * 86_400_000).toISOString(),
    amount,
    currency: 'USD' as const,
    rawDescriptor: vendor,
    normalizedVendor: vendor,
    subscriptionId: null,
  }));

describe('detector', () => {
  test('detects monthly subscription with stable price', () => {
    const c = charges('NETFLIX', [15.99, 15.99, 15.99, 15.99], 120, 30);
    const out = detectSubscriptions(c);
    expect(out.length).toBe(1);
    expect(out[0].cadence).toBe('monthly');
    expect(out[0].confidence).toBeGreaterThan(0.7);
  });

  test('detects annual subscription', () => {
    const c = charges('FIGMA', [144, 144], 730, 365);
    const out = detectSubscriptions(c);
    expect(out[0].cadence).toBe('annual');
  });

  test('skips one-off charges', () => {
    const c = charges('AMAZON', [42.51], 30, 0);
    const out = detectSubscriptions(c);
    expect(out.length).toBe(0);
  });

  test('detects 12% price hike', () => {
    const baseline = charges('SPOTIFY', [9.99, 9.99, 9.99, 9.99, 11.49], 150, 30);
    const sub = {
      id: 's1', userId: 'u1', vendor: 'SPOTIFY', vendorDomain: null, category: null,
      amount: 9.99, currency: 'USD' as const, cadence: 'monthly' as const,
      status: 'active' as const, trialEndsAt: null, nextChargeAt: null,
      lastSeenAt: new Date().toISOString(), detectedFrom: 'csv' as const,
      confidence: 0.95, notes: null,
    };
    const hike = detectPriceHike(sub, baseline);
    expect(hike).not.toBeNull();
    expect(hike!.hikePct).toBeGreaterThan(10);
  });
});

describe('redact', () => {
  test('strips email + card + phone', () => {
    const r = redact('Hi user@example.com card 4242 4242 4242 4242 phone +62 812-3456-7890');
    expect(r).not.toContain('user@example.com');
    expect(r).toContain('[EMAIL]');
    expect(r).toContain('[CARD]');
    expect(r).toContain('[PHONE]');
  });
});
