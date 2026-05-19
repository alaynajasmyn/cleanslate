'use client';
import useSWR, { mutate } from 'swr';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const fetcher = (url: string) => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return fetch(url, { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json());
};

export default function ActionsPage() {
  const { data: actions = [] } = useSWR(`${API}/actions`, fetcher);

  async function approve(id: string) {
    await fetch(`${API}/actions/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
    });
    mutate(`${API}/actions`);
  }

  async function reject(id: string) {
    await fetch(`${API}/actions/${id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
    });
    mutate(`${API}/actions`);
  }

  return (
    <div>
      <h1 className="h1">Action queue</h1>
      <p className="muted mt-1">AI-drafted cancellations &amp; negotiations. You approve before anything sends.</p>

      <div className="grid grid-cols-1 gap-3 mt-6">
        {actions.map((a: any) => (
          <div key={a.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold capitalize">{a.kind}</div>
                <div className="muted text-xs">status: {a.status}</div>
              </div>
              {a.expectedSavingsUsd && (
                <span className="tag">${a.expectedSavingsUsd.toFixed(0)}/yr saved</span>
              )}
            </div>
            {a.draftBody && (
              <pre className="mt-3 whitespace-pre-wrap text-sm bg-zinc-50 border border-zinc-200 rounded-lg p-3 font-sans">{a.draftBody}</pre>
            )}
            {a.status === 'suggested' && (
              <div className="flex gap-2 mt-3">
                <button className="btn" onClick={() => approve(a.id)}>Approve</button>
                <button className="btn-secondary" onClick={() => reject(a.id)}>Reject</button>
              </div>
            )}
          </div>
        ))}
        {actions.length === 0 && <div className="card muted">No pending actions.</div>}
      </div>
    </div>
  );
}
