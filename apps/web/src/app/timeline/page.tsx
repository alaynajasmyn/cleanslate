'use client';
import { DEMO_TIMELINE } from '@/lib/demo';

const KIND_STYLES: Record<string, { color: string; tag: string }> = {
  detected: { color: 'bg-emerald-500', tag: 'tag-good' },
  alert: { color: 'bg-amber-500', tag: 'tag-warn' },
  anomaly: { color: 'bg-red-500', tag: 'tag-bad' },
  sync: { color: 'bg-cyan-500', tag: '' },
  price_hike: { color: 'bg-amber-500', tag: 'tag-warn' },
  action: { color: 'bg-purple-500', tag: '' },
};

export default function TimelinePage() {
  return (
    <div>
      <h1 className="h1">Timeline</h1>
      <p className="text-zinc-500 text-sm mt-1">Chronological log of every detection, scan, and action.</p>

      <div className="card mt-6">
        <div className="space-y-1">
          {DEMO_TIMELINE.map((e, i) => {
            const style = KIND_STYLES[e.kind] ?? { color: 'bg-zinc-500', tag: '' };
            return (
              <div key={i} className="flex gap-4 p-3 hover:bg-[#0d0d16] rounded-lg transition">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${style.color} shadow-[0_0_8px_currentColor] mt-1`} />
                  {i < DEMO_TIMELINE.length - 1 && <div className="flex-1 w-px bg-[#1c1c2e] mt-1" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className={`tag ${style.tag} mr-2`}>{e.kind}</span>
                      <span className="font-medium">{e.vendor}</span>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">{e.date}</span>
                  </div>
                  <p className="text-zinc-400 text-sm mt-1">{e.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
