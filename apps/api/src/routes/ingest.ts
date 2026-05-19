import { Hono } from 'hono';
import { db, charges, subscriptions } from '@cleanslate/db';
import { eq } from 'drizzle-orm';
import { parseCsv } from '@cleanslate/connectors';
import { detectSubscriptions, categorize } from '@cleanslate/core';
import { authMiddleware } from '../middleware.js';

export const ingest = new Hono();
ingest.use('*', authMiddleware);

ingest.post('/csv', async (c) => {
  const userId = c.get('userId');
  const form = await c.req.formData();
  const file = form.get('file');
  const defaultCurrency = (form.get('currency') as string) ?? 'USD';
  if (!(file instanceof File)) return c.json({ error: 'no-file' }, 400);
  const text = await file.text();
  const rows = parseCsv(text, { userId, defaultCurrency: defaultCurrency as any, sourceRefPrefix: 'csv' });

  if (rows.length === 0) return c.json({ inserted: 0, detected: 0 });

  const inserted = await db.insert(charges).values(rows).onConflictDoNothing().returning();

  // Run detector on all charges (existing + new) for this user
  const all = await db.select().from(charges).where(eq(charges.userId, userId));
  const detections = detectSubscriptions(all as any);

  let upserts = 0;
  for (const d of detections) {
    const cat = categorize(d.vendor);
    const [s] = await db
      .insert(subscriptions)
      .values({
        userId,
        vendor: d.vendor,
        category: cat,
        amount: d.amount,
        currency: (rows[0].currency ?? 'USD') as any,
        cadence: d.cadence,
        status: 'active',
        nextChargeAt: d.nextChargeAt ? new Date(d.nextChargeAt) : null,
        lastSeenAt: new Date(d.charges[d.charges.length - 1].occurredAt),
        detectedFrom: 'csv',
        confidence: d.confidence,
      })
      .onConflictDoUpdate({
        target: [subscriptions.userId, subscriptions.vendor],
        set: {
          amount: d.amount,
          cadence: d.cadence,
          nextChargeAt: d.nextChargeAt ? new Date(d.nextChargeAt) : null,
          lastSeenAt: new Date(d.charges[d.charges.length - 1].occurredAt),
          confidence: d.confidence,
        },
      })
      .returning();
    if (s) upserts++;
  }

  return c.json({ inserted: inserted.length, detected: detections.length, upserts });
});
