import { Hono } from 'hono';
import { db, subscriptions, charges } from '@cleanslate/db';
import { eq, desc } from 'drizzle-orm';
import { rankCutCandidates, annualizedCost } from '@cleanslate/core';
import { authMiddleware } from '../middleware.js';

export const subs = new Hono();
subs.use('*', authMiddleware);

subs.get('/', async (c) => {
  const userId = c.get('userId');
  const list = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.lastSeenAt));
  const enriched = list.map((s) => ({ ...s, annualUsd: annualizedCost(s as any) }));
  return c.json(enriched);
});

subs.get('/cuts', async (c) => {
  const userId = c.get('userId');
  const list = (await db.select().from(subscriptions).where(eq(subscriptions.userId, userId))) as any[];
  return c.json(rankCutCandidates(list).slice(0, 10));
});

subs.get('/:id/charges', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const rows = await db.select().from(charges).where(eq(charges.subscriptionId, id));
  // double-check user isolation
  const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.id, id) });
  if (!sub || sub.userId !== userId) return c.json({ error: 'not-found' }, 404);
  return c.json(rows);
});
