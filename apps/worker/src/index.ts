import 'dotenv/config';
import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { db, sources, charges, subscriptions, anomalies, emailRecords } from '@cleanslate/db';
import { eq, and, gt, desc } from 'drizzle-orm';
import { detectSubscriptions, detectPriceHike, categorize, redact } from '@cleanslate/core';
import { classifyEmail } from '@cleanslate/agents';
import { GmailConnector } from '@cleanslate/connectors';

const conn = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const emailScan = new Queue('email-scan', { connection: conn });
const subDetect = new Queue('sub-detect', { connection: conn });
const trialWatch = new Queue('trial-watch', { connection: conn });

async function bootstrap() {
  await emailScan.add('tick', {}, { repeat: { every: 15 * 60_000 } });
  await subDetect.add('tick', {}, { repeat: { every: 60 * 60_000 } });
  await trialWatch.add('tick', {}, { repeat: { every: 60 * 60_000 } });
  console.log('worker schedules bootstrapped');
}

new Worker(
  'email-scan',
  async () => {
    const gmailSources = await db.query.sources.findMany({
      where: and(eq(sources.type, 'gmail'), eq(sources.enabled, true)),
    });
    let scanned = 0;
    for (const src of gmailSources) {
      try {
        const creds = JSON.parse(decryptIfNeeded(src.encryptedConfig));
        const c = new GmailConnector(creds);
        const since = src.lastSyncedAt ?? new Date(Date.now() - 30 * 86_400_000);
        const ids = await c.listMessages({ since });
        for (const id of ids.slice(0, 50)) {
          const m = await c.fetchMessage(id);
          const cls = await classifyEmail({
            subject: m.subject,
            from: m.from,
            snippet: m.snippet || m.body.slice(0, 1000),
          });
          await db
            .insert(emailRecords)
            .values({
              userId: src.userId,
              sourceId: src.id,
              messageId: m.id,
              fromAddr: m.from.slice(0, 200),
              subject: m.subject.slice(0, 300),
              receivedAt: m.receivedAt,
              redactedSnippet: redact(m.snippet).slice(0, 500),
              classified: cls.kind,
              vendorGuess: cls.vendor,
              amountGuess: cls.amount ?? null,
            })
            .onConflictDoNothing();
          scanned++;
        }
        await db.update(sources).set({ lastSyncedAt: new Date() }).where(eq(sources.id, src.id));
      } catch (e: any) {
        console.error('email-scan failed for source', src.id, e.message);
      }
    }
    return { scanned };
  },
  { connection: conn, concurrency: 2 },
);

new Worker(
  'sub-detect',
  async () => {
    const allCharges = await db.select().from(charges).orderBy(desc(charges.occurredAt));
    const byUser = new Map<string, typeof allCharges>();
    for (const c of allCharges) {
      const arr = byUser.get(c.userId) ?? [];
      arr.push(c);
      byUser.set(c.userId, arr);
    }
    let upserts = 0;
    for (const [userId, list] of byUser) {
      const detections = detectSubscriptions(list as any);
      for (const d of detections) {
        await db
          .insert(subscriptions)
          .values({
            userId,
            vendor: d.vendor,
            category: categorize(d.vendor),
            amount: d.amount,
            currency: list[0].currency,
            cadence: d.cadence,
            status: 'active',
            nextChargeAt: d.nextChargeAt ? new Date(d.nextChargeAt) : null,
            lastSeenAt: new Date(d.charges.at(-1)!.occurredAt),
            detectedFrom: 'csv',
            confidence: d.confidence,
          })
          .onConflictDoUpdate({
            target: [subscriptions.userId, subscriptions.vendor],
            set: {
              amount: d.amount,
              cadence: d.cadence,
              nextChargeAt: d.nextChargeAt ? new Date(d.nextChargeAt) : null,
              lastSeenAt: new Date(d.charges.at(-1)!.occurredAt),
              confidence: d.confidence,
            },
          });
        upserts++;

        const subRow = await db.query.subscriptions.findFirst({
          where: and(eq(subscriptions.userId, userId), eq(subscriptions.vendor, d.vendor)),
        });
        if (subRow) {
          const hike = detectPriceHike(subRow as any, d.charges as any);
          if (hike) {
            await db
              .insert(anomalies)
              .values({
                userId,
                kind: 'price_hike',
                severity: 'warn',
                subject: `${d.vendor} price up ${hike.hikePct}%`,
                detail: `Charge went from ${hike.from} to ${hike.to} ${list[0].currency}`,
                meta: hike,
              })
              .onConflictDoNothing();
          }
        }
      }
    }
    return { upserts };
  },
  { connection: conn, concurrency: 1 },
);

new Worker(
  'trial-watch',
  async () => {
    const cutoff = new Date(Date.now() + 3 * 86_400_000);
    const ending = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.status, 'trial'), gt(subscriptions.trialEndsAt, new Date())));
    let alerted = 0;
    for (const s of ending) {
      if (s.trialEndsAt && +s.trialEndsAt <= +cutoff) {
        await db
          .insert(anomalies)
          .values({
            userId: s.userId,
            kind: 'trial_ending',
            severity: 'warn',
            subject: `${s.vendor} trial ends soon`,
            detail: `Trial ends ${s.trialEndsAt!.toISOString().slice(0, 10)}`,
          })
          .onConflictDoNothing();
        alerted++;
      }
    }
    return { alerted };
  },
  { connection: conn },
);

new QueueEvents('email-scan', { connection: conn }).on('completed', ({ jobId, returnvalue }) => {
  console.log('email-scan done', jobId, returnvalue);
});

function decryptIfNeeded(payload: string): string {
  // The api/crypto module also lives in apps/api; for the worker we copy
  // the same logic to avoid an inter-app import. Identical algorithm.
  const crypto = require('node:crypto');
  const KEY = (process.env.ENCRYPTION_KEY ?? '').padEnd(44, '=');
  const key = Buffer.from(KEY, 'base64').slice(0, 32);
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

bootstrap().catch((e) => {
  console.error('bootstrap failed', e);
  process.exit(1);
});
