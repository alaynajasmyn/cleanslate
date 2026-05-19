# Cleanslate

> **The financial closet manager.** An AI agent that watches your inbox + bank, detects every subscription, alerts on anomalies, and cancels what you don't use — with your approval.

## Why

The average person leaks **$273/month** on subscriptions they forgot. Existing tools (Rocket Money, Truebill) are US-only, focus on bills, and don't cover non-US banks or Indonesian providers. Cleanslate is **global, multi-source, AI-native**.

## What it actually does

Cleanslate runs autonomous agents against three data streams:

| Stream | What it watches | Action |
|---|---|---|
| **Email** | Gmail / IMAP receipts, renewal notices, price hikes | Detect new subs, flag price hikes ≥ 10%, surface trial expiration ≤ 3 days |
| **Bank** | Card statement (CSV import or Plaid/Brick API) | Match charges → known subs, flag unrecognized recurring debits |
| **Calendar** | Free trial end dates, warranty expiry | Notify 7/3/1 days before, draft cancellation email |

Then it does what other apps don't:

- **Auto-draft cancellation** in user's voice, ready to send
- **Negotiate with vendor** (chat / email) for downgrade or discount
- **Categorize spend** beyond crude buckets (Adobe Suite vs Notion vs hosting)
- **Anomaly detection** ("electricity bill 32% higher than 12-month avg")
- **Warranty tracker** ("AirPods bought 2024-12-12 — 2 months left, save receipt")

## Anti-features (we will not do)

- ❌ Auto-pay your bills (one click is enough; full automation is risky and not differentiating)
- ❌ Credit score nagging (not our market)
- ❌ Investment advice (not our market)

## Architecture

```
                  ┌────────────────────────┐
                  │   apps/web (Next 14)   │  Dashboard, action queue
                  └────────────┬───────────┘
                               │
                  ┌────────────▼───────────┐
                  │   apps/api (Bun+Hono)  │  REST + WS
                  │     • OAuth (Google)   │
                  │     • Webhook (Stripe) │
                  └────────────┬───────────┘
                               │
                  ┌────────────▼───────────┐
                  │  packages/core         │  Detectors, scoring, redaction
                  │  packages/agents       │  LLM-driven workers
                  │  packages/connectors   │  Gmail, IMAP, CSV, Plaid
                  │  packages/db (Drizzle) │  Postgres schema
                  └────────────┬───────────┘
                               │
                  ┌────────────▼───────────┐
                  │   apps/worker (BullMQ) │  Scheduled scans
                  │     • email-scan       │
                  │     • bank-scan        │
                  │     • alert-dispatch   │
                  │     • trial-watch      │
                  └────────────────────────┘
```

## Privacy stance

- Email content is **redacted before LLM call** (PII scrubber: emails, addresses, full names, account numbers).
- Raw email bodies stored encrypted at rest, **purged after 30 days** unless user pins.
- Bank data: read-only access, never store credentials, only token-based.
- Self-hostable. Docker compose ships everything you need.

## Stack

- Runtime: **Bun** (3-4× faster cold start than Node for our workload)
- API: Hono + Zod + WebSockets
- DB: Postgres + Drizzle ORM (lighter than Prisma)
- Queue: BullMQ + Redis
- AI: Claude / GPT-4 / local Ollama via thin router
- Email: googleapis (Gmail API) + node-imap (universal)
- Frontend: Next 14 + Tailwind + Tremor charts
- Auth: Lucia (self-hosted OAuth, no Clerk lock-in)

## Pricing model (proposed)

| Tier | Price | Features |
|---|---|---|
| Free | $0 | 1 connected source, 30-day history |
| Pro | $9/mo | Unlimited sources, AI cancellation drafts, anomaly alerts |
| Pro+ | $19/mo | Negotiation agent, warranty vault, family (up to 5) |

Take rate: optional 25% of first-month savings if user opts in (success fee).

## Status

MVP scaffolding only. Real engine being built in this commit series.

```bash
bun install
docker compose -f infra/compose.yml up -d
bun --filter ./packages/db migrate
bun dev
```
