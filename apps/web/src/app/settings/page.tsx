'use client';
import { useState } from 'react';

export default function SettingsPage() {
  const [model, setModel] = useState('claude-haiku-4');
  const [language, setLanguage] = useState<'en' | 'id'>('id');
  const [autoApprove, setAutoApprove] = useState(false);
  const [tg, setTg] = useState(true);
  const [discord, setDiscord] = useState(false);

  return (
    <div>
      <h1 className="h1">Settings</h1>
      <p className="text-zinc-500 text-sm mt-1">Tune your agent. Local-first defaults.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="card">
          <div className="font-semibold">Agent</div>
          <p className="text-zinc-500 text-sm mt-1">Which model drafts your cancellations and negotiations.</p>
          <div className="mt-4 space-y-3">
            <Field label="Model">
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="claude-haiku-4">Claude Haiku 4 (default)</option>
                <option value="claude-sonnet-4">Claude Sonnet 4</option>
                <option value="gpt-4o-mini">GPT-4o mini</option>
                <option value="ollama:llama3.1">Local · Ollama llama3.1</option>
              </select>
            </Field>
            <Field label="Output language">
              <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
                <option value="en">English</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </Field>
            <Toggle label="Auto-approve trial cancellations" desc="Cancel before trial expires without asking" value={autoApprove} on={setAutoApprove} />
          </div>
        </div>

        <div className="card">
          <div className="font-semibold">Notifications</div>
          <p className="text-zinc-500 text-sm mt-1">Where alerts get delivered.</p>
          <div className="mt-4 space-y-3">
            <Toggle label="Telegram" desc="@cleanslate_bot" value={tg} on={setTg} />
            <Toggle label="Discord webhook" desc="POST to your channel" value={discord} on={setDiscord} />
            <Field label="Email digest">
              <select defaultValue="weekly">
                <option>off</option>
                <option>daily</option>
                <option>weekly</option>
                <option>monthly</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="card">
          <div className="font-semibold">Privacy</div>
          <p className="text-zinc-500 text-sm mt-1">What we keep, for how long.</p>
          <div className="mt-4 space-y-3">
            <Field label="Email body retention">
              <select defaultValue="30">
                <option value="0">Don't store</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </Field>
            <Field label="PII redaction">
              <select defaultValue="strict">
                <option value="strict">Strict (default)</option>
                <option value="standard">Standard</option>
                <option value="off">Off — not recommended</option>
              </select>
            </Field>
            <button className="btn-danger">Delete all data</button>
          </div>
        </div>

        <div className="card">
          <div className="font-semibold">Plan</div>
          <p className="text-zinc-500 text-sm mt-1">Currently on Free tier.</p>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm py-1.5 border-b border-[#1c1c2e]"><span className="text-zinc-500">Sources</span><span>1 of 1</span></div>
            <div className="flex justify-between text-sm py-1.5 border-b border-[#1c1c2e]"><span className="text-zinc-500">History</span><span>30 days</span></div>
            <div className="flex justify-between text-sm py-1.5 border-b border-[#1c1c2e]"><span className="text-zinc-500">AI drafts / mo</span><span>10</span></div>
            <div className="flex justify-between text-sm py-1.5"><span className="text-zinc-500">Agent autonomy</span><span>off</span></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn">Upgrade to Pro · $9/mo</button>
            <button className="btn-secondary">Compare plans</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toggle({ label, desc, value, on }: { label: string; desc: string; value: boolean; on: (v: boolean) => void }) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <div className="text-sm">{label}</div>
        <div className="text-xs text-zinc-500">{desc}</div>
      </div>
      <button
        onClick={() => on(!value)}
        className={`w-10 h-6 rounded-full p-1 transition ${value ? 'bg-emerald-500' : 'bg-[#232336]'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition ${value ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );
}
