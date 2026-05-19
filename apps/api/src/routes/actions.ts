import { Hono } from 'hono';
import { db, actions as actionsTbl, subscriptions } from '@cleanslate/db';
import { and, eq } from 'drizzle-orm';
import { draftCancellation, draftNegotiation } from '@cleanslate/agents';
import { authMiddleware } from '../middleware.js';

export const actions = new Hono();
actions.use('*', authMiddleware);

actions.get('/', async (c) => {
  const userId = c.get('userId');
  const list = await db.select().from(actionsTbl).where(eq(actionsTbl.userId, userId));
  return c.json(list);
});

actions.post('/draft-cancel/:subscriptionId', async (c) => {
  const userId = c.get('userId');
  const subscriptionId = c.req.param('subscriptionId');
  const sub = await db.query.subscriptions.findFirst({
    where: and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)),
  });
  if (!sub) return c.json({ error: 'not-found' }, 404);
  const body = await c.req.json().catch(() => ({}));
  const text = await draftCancellation({
    vendor: sub.vendor,
    userName: body.userName ?? 'User',
    reason: body.reason,
    language: body.language ?? 'en',
  });
  const [created] = await db
    .insert(actionsTbl)
    .values({
      userId,
      kind: 'cancel',
      subscriptionId,
      status: 'suggested',
      draftBody: text,
      channel: 'email',
      expectedSavingsUsd: sub.amount * 12,
    })
    .returning();
  return c.json(created);
});

actions.post('/draft-negotiate/:subscriptionId', async (c) => {
  const userId = c.get('userId');
  const subscriptionId = c.req.param('subscriptionId');
  const sub = await db.query.subscriptions.findFirst({
    where: and(eq(subscriptions.id, subscriptionId), eq(subscriptions.userId, userId)),
  });
  if (!sub) return c.json({ error: 'not-found' }, 404);
  const body = await c.req.json().catch(() => ({}));
  const text = await draftNegotiation({
    vendor: sub.vendor,
    userName: body.userName ?? 'User',
    currentAmount: sub.amount,
    competitorOffer: body.competitor,
    language: body.language ?? 'en',
  });
  const [created] = await db
    .insert(actionsTbl)
    .values({
      userId,
      kind: 'negotiate',
      subscriptionId,
      status: 'suggested',
      draftBody: text,
      channel: 'email',
    })
    .returning();
  return c.json(created);
});

actions.post('/:id/approve', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const [updated] = await db
    .update(actionsTbl)
    .set({ status: 'approved' })
    .where(and(eq(actionsTbl.id, id), eq(actionsTbl.userId, userId)))
    .returning();
  return c.json(updated ?? { error: 'not-found' });
});

actions.post('/:id/reject', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const [updated] = await db
    .update(actionsTbl)
    .set({ status: 'rejected' })
    .where(and(eq(actionsTbl.id, id), eq(actionsTbl.userId, userId)))
    .returning();
  return c.json(updated ?? { error: 'not-found' });
});
