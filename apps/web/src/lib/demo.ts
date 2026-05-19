/**
 * Demo data shown when API isn't reachable. Realistic Indonesian + global subs mix.
 */

export interface DemoSub {
  id: string;
  vendor: string;
  category: string;
  amount: number;
  currency: string;
  cadence: 'monthly' | 'annual' | 'weekly';
  status: 'active' | 'trial' | 'paused' | 'canceled';
  annualUsd: number;
  confidence: number;
  trialEndsAt?: string;
  lastSeenAt: string;
}

export const DEMO_SUBS: DemoSub[] = [
  { id: '1', vendor: 'Netflix', category: 'streaming', amount: 15.49, currency: 'USD', cadence: 'monthly', status: 'active', annualUsd: 185.88, confidence: 0.98, lastSeenAt: '2026-05-12' },
  { id: '2', vendor: 'Spotify Family', category: 'streaming', amount: 169000, currency: 'IDR', cadence: 'monthly', status: 'active', annualUsd: 130, confidence: 0.97, lastSeenAt: '2026-05-09' },
  { id: '3', vendor: 'Adobe Creative Cloud', category: 'productivity', amount: 54.99, currency: 'USD', cadence: 'monthly', status: 'active', annualUsd: 659.88, confidence: 0.99, lastSeenAt: '2026-05-15' },
  { id: '4', vendor: 'Figma Professional', category: 'productivity', amount: 144, currency: 'USD', cadence: 'annual', status: 'active', annualUsd: 144, confidence: 0.96, lastSeenAt: '2026-01-04' },
  { id: '5', vendor: 'OpenAI API', category: 'ai', amount: 28.40, currency: 'USD', cadence: 'monthly', status: 'active', annualUsd: 340.80, confidence: 0.92, lastSeenAt: '2026-05-18' },
  { id: '6', vendor: 'Anthropic Claude Pro', category: 'ai', amount: 20, currency: 'USD', cadence: 'monthly', status: 'active', annualUsd: 240, confidence: 0.98, lastSeenAt: '2026-05-14' },
  { id: '7', vendor: 'Vercel Pro', category: 'devtools', amount: 20, currency: 'USD', cadence: 'monthly', status: 'active', annualUsd: 240, confidence: 0.99, lastSeenAt: '2026-05-11' },
  { id: '8', vendor: 'GitHub Copilot', category: 'devtools', amount: 10, currency: 'USD', cadence: 'monthly', status: 'active', annualUsd: 120, confidence: 0.99, lastSeenAt: '2026-05-13' },
  { id: '9', vendor: 'Notion Plus', category: 'productivity', amount: 10, currency: 'USD', cadence: 'monthly', status: 'active', annualUsd: 120, confidence: 0.97, lastSeenAt: '2026-05-08' },
  { id: '10', vendor: 'Cloudflare Pro', category: 'devtools', amount: 20, currency: 'USD', cadence: 'monthly', status: 'active', annualUsd: 240, confidence: 0.95, lastSeenAt: '2026-05-10' },
  { id: '11', vendor: 'Indihome 100Mbps', category: 'utility-id', amount: 525000, currency: 'IDR', cadence: 'monthly', status: 'active', annualUsd: 405, confidence: 0.99, lastSeenAt: '2026-05-05' },
  { id: '12', vendor: 'PLN Listrik', category: 'utility-id', amount: 612000, currency: 'IDR', cadence: 'monthly', status: 'active', annualUsd: 472, confidence: 0.86, lastSeenAt: '2026-05-07' },
  { id: '13', vendor: 'Telkomsel Halo', category: 'utility-id', amount: 350000, currency: 'IDR', cadence: 'monthly', status: 'active', annualUsd: 270, confidence: 0.98, lastSeenAt: '2026-05-12' },
  { id: '14', vendor: 'iCloud 200GB', category: 'productivity', amount: 2.99, currency: 'USD', cadence: 'monthly', status: 'active', annualUsd: 35.88, confidence: 0.99, lastSeenAt: '2026-05-04' },
  { id: '15', vendor: 'YouTube Premium', category: 'streaming', amount: 13.99, currency: 'USD', cadence: 'monthly', status: 'active', annualUsd: 167.88, confidence: 0.98, lastSeenAt: '2026-05-09' },
  { id: '16', vendor: 'Vidio Diamond', category: 'streaming', amount: 65000, currency: 'IDR', cadence: 'monthly', status: 'trial', annualUsd: 50, confidence: 0.91, trialEndsAt: '2026-05-21', lastSeenAt: '2026-04-21' },
  { id: '17', vendor: 'ClassPass', category: 'fitness', amount: 99, currency: 'USD', cadence: 'monthly', status: 'paused', annualUsd: 1188, confidence: 0.95, lastSeenAt: '2026-04-15' },
  { id: '18', vendor: 'NYT Digital', category: 'news', amount: 17, currency: 'USD', cadence: 'monthly', status: 'active', annualUsd: 204, confidence: 0.99, lastSeenAt: '2026-05-10' },
];

export interface DemoAnomaly {
  id: string;
  kind: 'price_hike' | 'duplicate_charge' | 'unused_subscription' | 'trial_ending' | 'unusual_amount';
  severity: 'info' | 'warn' | 'critical';
  subject: string;
  detail: string;
  createdAt: string;
}

export const DEMO_ANOMALIES: DemoAnomaly[] = [
  { id: 'a1', kind: 'price_hike', severity: 'warn', subject: 'Netflix price up 12%', detail: 'Charge went from $13.99 to $15.49 USD on 2026-05-12.', createdAt: '2026-05-12' },
  { id: 'a2', kind: 'trial_ending', severity: 'warn', subject: 'Vidio Diamond trial ends in 2 days', detail: 'Will auto-renew at IDR 65.000/mo unless canceled.', createdAt: '2026-05-19' },
  { id: 'a3', kind: 'unused_subscription', severity: 'info', subject: 'ClassPass — no usage in 64 days', detail: 'Last gym check-in 2026-03-15. Annual cost $1,188.', createdAt: '2026-05-18' },
  { id: 'a4', kind: 'duplicate_charge', severity: 'critical', subject: 'Adobe charged twice', detail: 'Two $54.99 charges within 6 hours on 2026-05-15. Possible duplicate.', createdAt: '2026-05-15' },
  { id: 'a5', kind: 'unusual_amount', severity: 'warn', subject: 'PLN Listrik 32% above average', detail: 'May bill IDR 612.000 vs 12-mo avg IDR 463.500.', createdAt: '2026-05-07' },
];

export interface DemoAction {
  id: string;
  kind: 'cancel' | 'downgrade' | 'negotiate' | 'snooze';
  status: 'suggested' | 'approved' | 'sent' | 'completed';
  vendor: string;
  draftBody: string;
  expectedSavingsUsd: number;
}

export const DEMO_ACTIONS: DemoAction[] = [
  {
    id: 'act1',
    kind: 'cancel',
    status: 'suggested',
    vendor: 'ClassPass',
    expectedSavingsUsd: 1188,
    draftBody: `Hi ClassPass team,

I'd like to cancel my membership effective immediately. Please confirm in writing and stop any future billing on my account.

Per the FTC Click-to-Cancel rule, this request should be processed without retention offers.

Thanks,
Daa`,
  },
  {
    id: 'act2',
    kind: 'negotiate',
    status: 'suggested',
    vendor: 'Netflix',
    expectedSavingsUsd: 36,
    draftBody: `Halo Netflix,

Aku sudah jadi pelanggan 4 tahun di paket Premium. Kenaikan harga terbaru ke $15.49 cukup signifikan, dan aku lagi consider pindah ke Disney+ Hotstar yang lebih murah.

Apakah ada loyalty discount atau opsi downgrade ke Standard plan tanpa kehilangan profile yang sudah ada? Kalau tidak ada, aku akan cancel akhir bulan ini.

Terima kasih,
Daa`,
  },
  {
    id: 'act3',
    kind: 'downgrade',
    status: 'approved',
    vendor: 'Adobe Creative Cloud',
    expectedSavingsUsd: 432,
    draftBody: `Hi Adobe support,

I currently pay $54.99/mo for All Apps but I only actively use Photoshop and Lightroom. I'd like to downgrade to the Photography plan ($19.99/mo).

Please apply this change at the next billing cycle and confirm.

Best,
Daa`,
  },
];

export const DEMO_TIMELINE = [
  { date: '2026-05-19', kind: 'detected', vendor: 'Vidio Diamond', detail: 'Trial detected, ends 2026-05-21' },
  { date: '2026-05-18', kind: 'alert', vendor: 'ClassPass', detail: 'Flagged unused 64 days' },
  { date: '2026-05-15', kind: 'anomaly', vendor: 'Adobe', detail: 'Duplicate charge detected' },
  { date: '2026-05-14', kind: 'sync', vendor: 'Gmail', detail: '142 emails scanned · 6 receipts found' },
  { date: '2026-05-12', kind: 'price_hike', vendor: 'Netflix', detail: '$13.99 → $15.49 (+12%)' },
  { date: '2026-05-09', kind: 'detected', vendor: 'Spotify Family', detail: 'Recurring monthly IDR 169.000' },
  { date: '2026-05-07', kind: 'anomaly', vendor: 'PLN', detail: 'Bill 32% above 12-mo avg' },
  { date: '2026-05-05', kind: 'sync', vendor: 'BCA CSV', detail: '38 charges parsed · 4 new subs detected' },
  { date: '2026-05-02', kind: 'action', vendor: 'Adobe', detail: 'Downgrade draft approved → ready to send' },
];

export const DEMO_SPEND_BY_CATEGORY = [
  { category: 'productivity', annualUsd: 959.76, color: '#10b981' },
  { category: 'devtools', annualUsd: 600, color: '#06b6d4' },
  { category: 'streaming', annualUsd: 533.76, color: '#a855f7' },
  { category: 'utility-id', annualUsd: 1147, color: '#f59e0b' },
  { category: 'ai', annualUsd: 580.80, color: '#ec4899' },
  { category: 'fitness', annualUsd: 1188, color: '#ef4444' },
  { category: 'news', annualUsd: 204, color: '#8b5cf6' },
];

export const DEMO_MONTHLY_TREND = [
  { month: 'Dec', usd: 312 },
  { month: 'Jan', usd: 318 },
  { month: 'Feb', usd: 327 },
  { month: 'Mar', usd: 334 },
  { month: 'Apr', usd: 348 },
  { month: 'May', usd: 401 },
];
