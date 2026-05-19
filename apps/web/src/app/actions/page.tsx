'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { DEMO_ACTIONS } from '@/lib/demo';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const fetcher = async (url: string) => {
  if (!url.startsWith('http')) throw new Error('no-api');
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const r = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) throw new Error('not-ok');
  return r.json();
};

export default function ActionsPage() {
  const { data: live } = useSWR(API ? `${API}/actions` : null, fetcher);
  const items = live ?? DEMO_ACTIONS;
  const isDemo = !live;
  const [opened, setOpened] = useState<string | null>(items[0]?.id ?? null);

  const totalSavings = items.reduce((acc: number, a: any) => acc + (a.expectedSavingsUsd ?? 0), 0);
  const groupBy = (k: string) => items.filter((a: any) => a.status === k);

  return (
    <div>
      <div className="flex justify-between items-end gap-3">
        <div>
          <h1 className="h1">Action queue</h1>
          <p className="text-zinc-500 text-sm mt-1">AI-drafted in your voice. You always approve before anything sends.</p>
        </div>
        <div className="text-right">
          <div className="text-zinc-500 text-xs uppercase">Pending savings</div>
          <div className="text-2xl text-emerald-400 font-semibold">${Math.round(totalSavings)}<span className="text-zinc-500 text-sm">/yr</span></div>
        </div>
      </div>

      {isDemo && (
        <div className="mt-3 rounded-xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-2 text-xs text-emerald-300">
          Demo data — connect Gmail or upload a CSV to populate from your real subs.
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
        {([
          ['suggested', 'Suggested'],
          ['approved', 'Approved'],
          ['sent', 'Sent'],
        ] as const).map(([k, label]) => (
          <div key={k} className="card-dark text-center">
            <div className="text-zinc-500">{label}</div>
            <div className="text-lg font-semibold mt-0.5">{groupBy(k).length}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
        <div className="lg:col-span-1 space-y-2">
          {items.map((a: any) => (
            <button
              key={a.id}
              onClick={() => setOpened(a.id)}
              className={`w-full text-left card hover:border-emerald-700/50 transition ${opened === a.id ? 'border-emerald-700/50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium capitalize">{a.kind} {a.vendor}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">${a.expectedSavingsUsd}/yr</div>
                </div>
                <span className={`tag ${a.status === 'approved' ? 'tag-good' : a.status === 'suggested' ? 'tag-warn' : ''}`}>{a.status}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2">
          {(() => {
            const a = items.find((x: any) => x.id === opened) ?? items[0];
            if (!a) return <div className="card text-zinc-500">No actions yet.</div>;
            return (
              <div className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-zinc-500 text-xs uppercase">Action</div>
                    <div className="text-xl font-semibold mt-1 capitalize">{a.kind} — {a.vendor}</div>
                  </div>
                  <span className="tag-good tag">${a.expectedSavingsUsd}/yr</span>
                </div>
                <div className="divider my-4" />
                <pre className="whitespace-pre-wrap text-sm bg-[#0d0d16] border border-[#1c1c2e] rounded-xl p-4 font-sans leading-6">{a.draftBody}</pre>
                <div className="flex gap-2 mt-4">
                  <button className="btn">Approve & send</button>
                  <button className="btn-secondary">Edit draft</button>
                  <button className="btn-danger ml-auto">Reject</button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
