'use client';
import { DEMO_SUBS, DEMO_SPEND_BY_CATEGORY, DEMO_MONTHLY_TREND } from '@/lib/demo';

export default function SpendPage() {
  const totalAnnual = DEMO_SUBS.reduce((a, s) => a + s.annualUsd, 0);
  const monthly = totalAnnual / 12;

  return (
    <div>
      <h1 className="h1">Spend</h1>
      <p className="text-zinc-500 text-sm mt-1">Where your money actually goes.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <Stat label="Annual" value={`$${totalAnnual.toFixed(0)}`} />
        <Stat label="Monthly" value={`$${monthly.toFixed(0)}`} accent />
        <Stat label="Per day" value={`$${(monthly / 30).toFixed(2)}`} />
        <Stat label="vs 6mo ago" value="+28%" sub="trending up" warn />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
        <div className="card">
          <h2 className="font-semibold mb-3">Trend</h2>
          <BarChart data={DEMO_MONTHLY_TREND} />
        </div>
        <div className="card">
          <h2 className="font-semibold mb-3">By category</h2>
          <Donut data={DEMO_SPEND_BY_CATEGORY} />
        </div>
      </div>

      <h2 className="text-lg font-semibold mt-10">Top vendors</h2>
      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 border-b border-[#1c1c2e]">
              <th className="py-2 pr-4">Vendor</th>
              <th>Category</th>
              <th>Cadence</th>
              <th className="text-right">Per cycle</th>
              <th className="text-right">Annual</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_SUBS.slice().sort((a, b) => b.annualUsd - a.annualUsd).map((s) => (
              <tr key={s.id} className="border-b border-[#1c1c2e] hover:bg-[#0d0d16]">
                <td className="py-2.5 pr-4 font-medium">{s.vendor}</td>
                <td className="text-zinc-400">{s.category}</td>
                <td><span className="tag">{s.cadence}</span></td>
                <td className="text-right font-mono text-zinc-300">{s.amount.toLocaleString()} {s.currency}</td>
                <td className="text-right font-mono text-emerald-400">${s.annualUsd.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent, warn }: { label: string; value: any; sub?: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="card-dark">
      <div className="text-zinc-500 text-xs uppercase">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${accent ? 'text-emerald-400' : warn ? 'text-amber-400' : ''}`}>{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function BarChart({ data }: { data: { month: string; usd: number }[] }) {
  const max = Math.max(...data.map((d) => d.usd));
  return (
    <div className="flex items-end gap-3 h-44">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center justify-end">
          <div className="text-xs text-zinc-500 mb-1 font-mono">${d.usd}</div>
          <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-700 to-emerald-400" style={{ height: `${(d.usd / max) * 100}%` }} />
          <div className="text-xs text-zinc-500 mt-1">{d.month}</div>
        </div>
      ))}
    </div>
  );
}

function Donut({ data }: { data: { category: string; annualUsd: number; color: string }[] }) {
  const total = data.reduce((a, b) => a + b.annualUsd, 0);
  const r = 60;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="-80 -80 160 160" className="w-44 h-44">
        {data.map((s, i) => {
          const frac = s.annualUsd / total;
          const dash = c * frac;
          const el = (
            <circle
              key={i}
              r={r}
              fill="transparent"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90)"
            />
          );
          offset += dash;
          return el;
        })}
        <text textAnchor="middle" dy="0.3em" fontSize="14" fill="#e5e5ea" className="font-mono">
          ${total.toFixed(0)}
        </text>
      </svg>
      <ul className="text-xs space-y-1">
        {data.map((s) => (
          <li key={s.category} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="text-zinc-400">{s.category}</span>
            <span className="ml-auto font-mono text-zinc-300">${s.annualUsd.toFixed(0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
