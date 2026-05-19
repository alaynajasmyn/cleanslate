'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const fetcher = (url: string) => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return fetch(url, { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json());
};

export default function SourcesPage() {
  const { data: sources = [] } = useSWR(`${API}/sources`, fetcher);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function uploadCsv(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    mutate(`${API}/subscriptions/cuts`);
  }

  async function connectGmail() {
    const userId = JSON.parse(atob((localStorage.getItem('token') ?? '').split('.')[1] ?? 'e30=')).sub;
    const r = await fetch(`${API}/auth/google/url?userId=${userId}`);
    const { url } = await r.json();
    window.location.href = url;
  }

  return (
    <div>
      <h1 className="h1">Sources</h1>
      <p className="muted mt-1">Connect inboxes and bank statements. Read-only.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
        <div className="card">
          <div className="font-semibold">Gmail</div>
          <p className="muted mt-1">OAuth read-only. Scans receipts, renewals, trial reminders.</p>
          <button className="btn mt-3" onClick={connectGmail}>Connect Gmail</button>
        </div>

        <div className="card">
          <div className="font-semibold">Bank CSV</div>
          <p className="muted mt-1">Upload monthly statement (BCA, Mandiri, Chase, BoA, etc).</p>
          <form onSubmit={uploadCsv} className="mt-3 flex gap-2 items-center">
            <input type="file" name="file" accept=".csv" required />
            <select name="currency" className="border rounded-md px-2 py-1 text-sm">
              {['USD','EUR','IDR','SGD','GBP'].map(c => <option key={c}>{c}</option>)}
            </select>
            <button className="btn" disabled={uploading}>{uploading ? 'Working…' : 'Upload'}</button>
          </form>
          {result && (
            <p className="muted mt-3">
              {result.inserted} charges parsed → {result.detected} subscriptions detected.
            </p>
          )}
        </div>
      </div>

      <h2 className="text-lg font-semibold mt-10">Connected</h2>
      <ul className="mt-3 space-y-2">
        {sources.map((s: any) => (
          <li key={s.id} className="card flex justify-between">
            <div>
              <div className="font-medium">{s.label ?? s.type}</div>
              <div className="muted text-xs">last synced: {s.lastSyncedAt ?? 'never'}</div>
            </div>
            <span className="tag">{s.type}</span>
          </li>
        ))}
        {sources.length === 0 && <li className="muted">No sources yet.</li>}
      </ul>
    </div>
  );
}
