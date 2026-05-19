'use client';
import useSWR from 'swr';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
const fetcher = (url: string) => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return fetch(url, { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json());
};

export default function AnomaliesPage() {
  const { data: items = [] } = useSWR(`${API}/anomalies`, fetcher);

  return (
    <div>
      <h1 className="h1">Anomalies</h1>
      <p className="muted mt-1">Price hikes, duplicate charges, unused subs.</p>

      <ul className="mt-6 space-y-3">
        {items.map((a: any) => (
          <li key={a.id} className="card">
            <div className="flex justify-between">
              <div className="font-semibold">{a.subject}</div>
              <span className={`tag ${a.severity === 'critical' ? 'bg-red-100 text-red-800' : a.severity === 'warn' ? 'bg-amber-100 text-amber-800' : ''}`}>
                {a.severity}
              </span>
            </div>
            <p className="muted mt-1">{a.detail}</p>
          </li>
        ))}
        {items.length === 0 && <li className="muted">All quiet.</li>}
      </ul>
    </div>
  );
}
