'use client';
import useSWR from 'swr';
import { DEMO_SUBS, DEMO_ANOMALIES, DEMO_SPEND_BY_CATEGORY, DEMO_MONTHLY_TREND } from '@/lib/demo';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const fetcher = async (url: string) => {
  if (!url.startsWith('http')) throw new Error('no-api');
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const r = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) throw new Error('not-ok');
  return r.json();
};

export default function Home() {
  const { data: subsLive, error } = useSWR(API ? `${API}/subscriptions` : null, fetcher);
  const subs = subsLive ?? DEMO_SUBS;
  const isDemo = !subsLive;

  const active = subs.filter((s: any) => s.status === 'active');
  const trial = subs.filter((s: any) => s.status === 'trial');
  const totalAnnual = subs.reduce((acc: number, s: any) => acc + (s.annualUsd ?? 0), 0);
  const monthly = totalAnnual / 12;
  const cuts = [...subs]
    .filter((s) => s.status === 'active' || s.status === 'paused')
    .sort((a, b) => b.annualUsd - a.annualUsd)
    .slice(0, 6);

  return (
    <div>
      {isDemo && (
        <div className="mb-6 rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Showing demo data — connect a source in <a className="underline" href="/sources">Sources</a> to load yours.
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="h1">Closet</h1>
          <p className="text-zinc-500 mt-1 text-sm">Everything you pay for, in one place.</p>
        </div>
        <div className="flex gap-2">
          <a href="/sources" className="btn-secondary">+ Connect source</a>
          <a href="/actions" className="btn">Review action queue →</a>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        <Stat label="Active subs" value={active.length} sub={`${trial.length} on trial`} />
        <Stat label="Monthly burn" value={`$${monthly.toFixed(0)}`} accent />
        <Stat label="Annual" value={`$${totalAnnual.toFixed(0)}`} />
        <Stat label="Potential savings" value={`$${Math.round(totalAnnual * 0.18)}`} sub="cuts + negotiation" accent2 />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Spend trend (6mo)</h2>
            <span className="text-xs text-zinc-500">USD / month</span>
          </div>
          <Sparkline data={DEMO_MONTHLY_TREND} />
        </div>
        <div className="card">
          <h2 className="font-semibold mb-3">By category</h2>
          <div className="space-y-2 text-sm">
            {DEMO_SPEND_BY_CATEGORY.map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{c.category}</span>
                  <span className="font-mono">${c.annualUsd.toFixed(0)}</span>
                </div>
                <div className="h-1.5 mt-1 rounded-full bg-[#1c1c2e]">
                  <div className="h-full rounded-full" style={{ width: `${(c.annualUsd / 1300) * 100}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mt-10 flex items-center gap-2">
        Cut candidates <span className="tag">{cuts.length}</span>
      </h2>
      <p className="text-zinc-500 text-sm">Sorted by annualised cost. Click to draft a cancellation in your voice.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {cuts.map((s: any) => (
          <div key={s.id} className="card hover:border-emerald-700/50 transition cursor-pointer group">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{s.vendor}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{s.category} · {s.cadence}</div>
              </div>
              {s.status === 'paused' && <span className="tag tag-warn">paused</span>}
              {s.status === 'trial' && <span className="tag tag-warn">trial</span>}
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-2xl font-semibold font-mono">${s.annualUsd}</div>
                <div className="text-xs text-zinc-500">/year</div>
              </div>
              <button className="btn-secondary opacity-0 group-hover:opacity-100 transition">Draft cancel</button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-10">Recent anomalies</h2>
      <div className="space-y-2 mt-3">
        {DEMO_ANOMALIES.slice(0, 4).map((a) => (
          <div key={a.id} className="card flex items-start justify-between gap-3">
            <div>
              <div className="font-medium">{a.subject}</div>
              <div className="text-zinc-500 text-sm mt-0.5">{a.detail}</div>
            </div>
            <span className={`tag ${a.severity === 'critical' ? 'tag-bad' : a.severity === 'warn' ? 'tag-warn' : ''}`}>{a.severity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent, accent2 }: { label: string; value: any; sub?: string; accent?: boolean; accent2?: boolean }) {
  return (
    <div className="card-dark">
      <div className="text-zinc-500 text-xs uppercase tracking-wide">{label}</div>
      <div className={`text-3xl font-semibold mt-1 ${accent ? 'text-emerald-400' : accent2 ? 'text-cyan-300' : ''}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function Sparkline({ data }: { data: { month: string; usd: number }[] }) {
  const max = Math.max(...data.map((d) => d.usd));
  const min = Math.min(...data.map((d) => d.usd));
  const w = 600;
  const h = 140;
  const stepX = w / (data.length - 1);
  const norm = (v: number) => h - ((v - min) / (max - min || 1)) * (h - 20) - 10;
  const points = data.map((d, i) => `${i * stepX},${norm(d.usd)}`).join(' ');
  const area = `${points} ${w},${h} 0,${h}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill="url(#g)" points={area} />
        <polyline fill="none" stroke="#10b981" strokeWidth="2" points={points} />
        {data.map((d, i) => (
          <circle key={i} cx={i * stepX} cy={norm(d.usd)} r="3" fill="#10b981" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-zinc-500 mt-1">
        {data.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
    </div>
  );
}
