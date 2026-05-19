'use client';
import useSWR from 'swr';
import { DEMO_ANOMALIES } from '@/lib/demo';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const fetcher = async (url: string) => {
  if (!url.startsWith('http')) throw new Error('no-api');
  const r = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` } });
  if (!r.ok) throw new Error('not-ok');
  return r.json();
};

const ICONS: Record<string, string> = {
  price_hike: '↗',
  duplicate_charge: '××',
  unused_subscription: '∅',
  trial_ending: '⏳',
  unusual_amount: '!',
};

export default function AnomaliesPage() {
  const { data: live } = useSWR(API ? `${API}/anomalies` : null, fetcher);
  const items = live ?? DEMO_ANOMALIES;
  const groupedBySev = {
    critical: items.filter((a: any) => a.severity === 'critical'),
    warn: items.filter((a: any) => a.severity === 'warn'),
    info: items.filter((a: any) => a.severity === 'info'),
  };

  return (
    <div>
      <h1 className="h1">Anomalies</h1>
      <p className="text-zinc-500 text-sm mt-1">Price hikes, duplicate charges, unused subs, trial deadlines.</p>

      <div className="grid grid-cols-3 gap-3 mt-6">
        <Stat label="Critical" count={groupedBySev.critical.length} color="text-red-400" />
        <Stat label="Warning" count={groupedBySev.warn.length} color="text-amber-400" />
        <Stat label="Info" count={groupedBySev.info.length} color="text-zinc-300" />
      </div>

      <ul className="mt-8 space-y-3">
        {items.map((a: any) => (
          <li key={a.id} className="card flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
              a.severity === 'critical' ? 'bg-red-950/60 text-red-400 border border-red-900' :
              a.severity === 'warn' ? 'bg-amber-950/60 text-amber-400 border border-amber-900' :
              'bg-zinc-800 text-zinc-300'
            }`}>
              {ICONS[a.kind] ?? '·'}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="font-medium">{a.subject}</div>
                <span className="text-xs text-zinc-500">{a.createdAt ?? a.created_at ?? ''}</span>
              </div>
              <p className="text-zinc-400 mt-1 text-sm">{a.detail}</p>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="text-zinc-500">All quiet.</li>}
      </ul>
    </div>
  );
}

function Stat({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="card-dark">
      <div className="text-zinc-500 text-xs uppercase tracking-wide">{label}</div>
      <div className={`text-3xl font-semibold mt-1 ${color}`}>{count}</div>
    </div>
  );
}
