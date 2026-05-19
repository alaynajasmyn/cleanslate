/**
 * AI agents: Classifier, Negotiator, CancellationDrafter.
 * Each takes redacted input → returns structured output. No raw PII.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import axios from 'axios';
import { redact } from '@cleanslate/core';
import type { EmailRecord, Subscription } from '@cleanslate/shared';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ChatOpts {
  prompt: string;
  system?: string;
  maxTokens?: number;
  model?: string;
}

async function chat(opts: ChatOpts): Promise<string> {
  const model = opts.model || process.env.DEFAULT_MODEL || 'claude-haiku-4';
  if (model.startsWith('ollama:')) {
    const r = await axios.post(
      `${process.env.OLLAMA_URL || 'http://localhost:11434'}/api/chat`,
      {
        model: model.slice(7),
        messages: [
          ...(opts.system ? [{ role: 'system', content: opts.system }] : []),
          { role: 'user', content: opts.prompt },
        ],
        stream: false,
      },
    );
    return r.data.message?.content ?? '';
  }
  if (model.startsWith('claude')) {
    const r = await anthropic.messages.create({
      model: model === 'claude-haiku-4' ? 'claude-haiku-4-20250514' : model,
      system: opts.system,
      messages: [{ role: 'user', content: opts.prompt }],
      max_tokens: opts.maxTokens ?? 1024,
    });
    return r.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');
  }
  if (model.startsWith('gpt')) {
    const r = await openai.chat.completions.create({
      model,
      messages: [
        ...(opts.system ? [{ role: 'system' as const, content: opts.system }] : []),
        { role: 'user' as const, content: opts.prompt },
      ],
      max_tokens: opts.maxTokens ?? 1024,
    });
    return r.choices[0]?.message?.content ?? '';
  }
  throw new Error(`unknown model: ${model}`);
}

/* ─────────── Email classifier ─────────── */

const CLASSIFIER_SYSTEM = `You classify a single email snippet about a financial transaction or subscription.
Output strict JSON only:
{
 "kind": "receipt" | "renewal" | "price_hike" | "trial_end" | "cancel_confirm" | "other",
 "vendor": "<best guess vendor name, brand only>" | null,
 "amount": <number> | null,
 "currency": "<ISO 4217>" | null,
 "trial_ends_at": "<YYYY-MM-DD>" | null,
 "confidence": <0..1>
}
Rules:
- Use null when uncertain. Do not guess.
- Vendor is the brand (e.g. Netflix), never the email sender domain.
- Amounts in foreign locale ("Rp 99.000") should be parsed as number.
`;

export async function classifyEmail(rec: { subject: string; from: string; snippet: string }): Promise<{
  kind: EmailRecord['classified'];
  vendor: string | null;
  amount: number | null;
  currency: string | null;
  trialEndsAt: string | null;
  confidence: number;
}> {
  const safe = {
    subject: redact(rec.subject),
    from: redact(rec.from),
    snippet: redact(rec.snippet).slice(0, 1500),
  };
  const text = await chat({
    system: CLASSIFIER_SYSTEM,
    prompt: `Subject: ${safe.subject}\nFrom: ${safe.from}\nBody: ${safe.snippet}`,
    maxTokens: 200,
  });
  try {
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? text);
    return {
      kind: parsed.kind ?? 'other',
      vendor: parsed.vendor,
      amount: parsed.amount,
      currency: parsed.currency,
      trialEndsAt: parsed.trial_ends_at,
      confidence: parsed.confidence ?? 0.5,
    };
  } catch {
    return { kind: 'other', vendor: null, amount: null, currency: null, trialEndsAt: null, confidence: 0 };
  }
}

/* ─────────── Cancellation drafter ─────────── */

export async function draftCancellation({
  vendor,
  userName,
  reason,
  language = 'en',
}: {
  vendor: string;
  userName: string;
  reason?: string;
  language?: 'en' | 'id';
}): Promise<string> {
  const sys = `You write short, courteous cancellation requests.
- Output PLAIN TEXT only — no markdown, no greetings like "Sure!".
- Be firm: state cancellation, ask for written confirmation, mention right to refund where applicable.
- Match the language: ${language === 'id' ? 'Bahasa Indonesia, kasual aku/kamu' : 'English'}.
- Length: 5-8 lines max.
`;
  const user = `Draft a cancellation email to ${vendor} from ${userName}.
${reason ? `Reason: ${reason}` : ''}`;
  return chat({ system: sys, prompt: user, maxTokens: 300 });
}

/* ─────────── Negotiation drafter ─────────── */

export async function draftNegotiation({
  vendor,
  userName,
  currentAmount,
  competitorOffer,
  language = 'en',
}: {
  vendor: string;
  userName: string;
  currentAmount: number;
  competitorOffer?: { brand: string; amount: number };
  language?: 'en' | 'id';
}): Promise<string> {
  const sys = `You write effective, non-confrontational negotiation messages to vendors.
Tactics:
- Anchor with competitor offer if provided.
- Use BATNA explicitly (will cancel if no concession).
- Ask for: discount %, free months, plan downgrade, loyalty match.
- Output PLAIN TEXT only. Match language: ${language === 'id' ? 'Bahasa Indonesia kasual' : 'English'}.
- 6-10 lines.`;
  const user = `Draft message to ${vendor} from ${userName}, currently paying ${currentAmount}/cycle.
${competitorOffer ? `Competitor: ${competitorOffer.brand} offers ${competitorOffer.amount}/cycle.` : ''}`;
  return chat({ system: sys, prompt: user, maxTokens: 400 });
}

/* ─────────── Insight summarizer ─────────── */

export async function summarizeMonth({
  totalSpend,
  topCategories,
  newSubs,
  anomalies,
  language = 'en',
}: {
  totalSpend: number;
  topCategories: { category: string; amountUsd: number }[];
  newSubs: Pick<Subscription, 'vendor' | 'amount' | 'currency'>[];
  anomalies: { kind: string; subject: string }[];
  language?: 'en' | 'id';
}): Promise<string> {
  const sys = `Write a concise monthly summary of the user's subscriptions.
- 3 short paragraphs MAX.
- Highlight cuts the user can make today.
- Match language: ${language === 'id' ? 'Bahasa Indonesia' : 'English'}.`;
  const data = {
    totalSpend,
    topCategories,
    newSubs: newSubs.map((s) => `${s.vendor} ${s.amount} ${s.currency}`),
    anomalies: anomalies.map((a) => `${a.kind}: ${a.subject}`),
  };
  return chat({ system: sys, prompt: JSON.stringify(data), maxTokens: 600 });
}
