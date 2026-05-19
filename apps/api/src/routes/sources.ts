import { Hono } from 'hono';
import { db, sources } from '@cleanslate/db';
import { and, eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware.js';

export const sources_ = new Hono();
export const sourcesRouter = sources_;

sources_.use('*', authMiddleware);
sources_.get('/', async (c) => {
  const userId = c.get('userId');
  const list = await db.query.sources.findMany({ where: eq(sources.userId, userId) });
  return c.json(list.map((s) => ({ ...s, encryptedConfig: undefined })));
});

sources_.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  await db.delete(sources).where(and(eq(sources.id, id), eq(sources.userId, userId)));
  return c.json({ ok: true });
});

export { sources_ as sources };
