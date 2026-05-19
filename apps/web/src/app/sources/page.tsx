'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const fetcher = async (url: string) => {
  if (!url.startsWith('http')) throw new Error('no-api');
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const r = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) throw new Error('not-ok');
  return r.json();
};

const DEMO_SOURCES = [
  { id: 'demo-gmail', type: 'gmail', label: 'Gmail · daa@example.com', lastSyncedAt: '2026-05-19 13:21' },
  { id: 'demo-bca', type: 'csv', label: 'BCA · May statement', lastSyncedAt: '2026-05-05 09:14' },
  { id: 'demo-chase', type: 'plaid', label: 'Chase Sapphire · live', lastSyncedAt: '2026-05-19 14:55' },
];

export default function SourcesPage() {
  const { data: live } = useSWR(API ? `${API}/sources` : null, fetcher);
  const sources = live ?? DEMO_SOURCES;
  const isDemo = !live;
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function uploadCsv(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isDemo) {
      setResult({ inserted: 38, detected: 5 });
      return;
    }
    setUploading(true);
    const fd = new FormData(e.currentTarget);
    const r = await fetch(`${API}/ingest/csv`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
      body: fd,
    });
    setResult(await r.json());
    setUploading(false);
    mutate(`${API}/subscriptions`);
  }

  async function connectGmail() {
    if (isDemo) {
      alert('Connect Gmail in production. Demo only.');
      return;
    }
    const userId = JSON.parse(atob((localStorage.getItem('token') ?? '').split('.')[1] ?? 'e30=')).sub;
    const r = await fetch(`${API}/auth/google/url?userId=${userId}`);
    const { url } = await r.json();
    window.location.href = url;
  }

  return (
    <div>
      <h1 className="h1">Sources</h1>
      <p className="text-zinc-500 mt-1 text-sm">Connect read-only data streams. Cleanslate never stores your bank credentials.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <SourceCard
          title="Gmail"
          desc="OAuth read-only. Scans receipts, renewal notices, trial reminders. Stored encrypted."
          tag="oauth"
          action={<button className="btn" onClick={connectGmail}>Connect</button>}
        />
        <SourceCard
          title="Bank CSV"
          desc="Upload monthly statement. Works with BCA, Mandiri, BRI, Chase, BoA, and most banks."
          tag="csv"
          action={
            <form onSubmit={uploadCsv} className="flex gap-2 items-center">
              <input type="file" name="file" accept=".csv" required />
              <select name="currency">
                {['USD','EUR','IDR','SGD','GBP'].map(c => <option key={c}>{c}</option>)}
              </select>
              <button className="btn" disabled={uploading}>{uploading ? '...' : 'Upload'}</button>
            </form>
          }
          extra={result && (<p className="text-xs text-emerald-400 mt-2">{result.inserted} charges parsed → {result.detected} subs.</p>)}
        />
        <SourceCard
          title="Plaid"
          desc="Live bank API. Auto-sync daily. US, EU, SG. Coming soon for Indonesia (via Brick)."
          tag="api"
          action={<button className="btn-secondary" disabled>Coming soon</button>}
        />
      </div>

      <h2 className="text-lg font-semibold mt-10">Connected ({sources.length})</h2>
      <ul className="space-y-2 mt-3">
        {sources.map((s: any) => (
          <li key={s.id} className="card flex justify-between items-center">
            <div>
              <div className="font-medium">{s.label ?? s.type}</div>
              <div className="text-xs text-zinc-500">last synced: {s.lastSyncedAt ?? 'never'}</div>
            </div>
            <span className="tag">{s.type}</span>
          </li>
        ))}
      </ul>

      <div className="card mt-8 text-sm">
        <div className="font-medium">Privacy</div>
        <ul className="text-zinc-400 mt-2 space-y-1 text-sm list-disc pl-5">
          <li>Email content is redacted before any LLM call (PII scrubber).</li>
          <li>Raw bodies stored encrypted at rest, purged after 30 days.</li>
          <li>Bank data: read-only token, no credentials stored.</li>
          <li>Self-hostable — Docker compose ships everything.</li>
        </ul>
      </div>
    </div>
  );
}

function SourceCard({ title, desc, tag, action, extra }: { title: string; desc: string; tag: string; action: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div className="font-semibold">{title}</div>
        <span className="tag">{tag}</span>
      </div>
      <p className="text-zinc-500 text-sm mt-2 leading-5">{desc}</p>
      <div className="mt-4">{action}</div>
      {extra}
    </div>
  );
}
