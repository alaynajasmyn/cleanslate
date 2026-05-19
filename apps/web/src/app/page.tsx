'use client';
import useSWR from 'swr';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const fetcher = (url: string) => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return fetch(url, { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json());
};

export default function Home() {
  const { data: subs = [] } = useSWR(`${API}/subscriptions`, fetcher);
  const { data: cuts = [] } = useSWR(`${API}/subscriptions/cuts`, fetcher);

  const totalAnnual = subs.reduce((acc: number, s: any) => acc + (s.annualUsd ?? 0), 0);
  const monthly = totalAnnual / 12;

  return (
    <div>
      <h1 className="h1">Closet</h1>
      <p className="muted mt-1">Everything you pay for, in one place.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
        <Stat label="Active subscriptions" value={subs.filter((s: any) => s.status === 'active').length} />
        <Stat label="Monthly burn" value={`$${monthly.toFixed(0)}`} />
        <Stat label="Annual" value={`$${totalAnnual.toFixed(0)}`} />
      </div>

      <h2 className="text-lg font-semibold mt-10">Cut candidates</h2>
      <p className="muted">Sorted by annualised cost. Click to draft a cancellation.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {cuts.map((s: any) => (
          <a key={s.id} href={`/subs/${s.id}`} className="card hover:border-zinc-400">
            <div className="flex justify-between">
              <div className="font-semibold">{s.vendor}</div>
              <div className="tag">{s.cadence}</div>
            </div>
            <div className="muted mt-1">{s.category ?? 'uncategorized'}</div>
            <div className="text-xl mt-3 font-mono">${s.annualUsd}/yr</div>
          </a>
        ))}
        {cuts.length === 0 && (
          <div className="card muted">No data yet. Upload a CSV in /sources.</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}
