import { Hono } from 'hono';
import { authorizeUrl, exchangeCode } from '@cleanslate/connectors';
import { db, users, sources } from '@cleanslate/db';
import { eq } from 'drizzle-orm';
import { encrypt } from '../crypto.js';
import jwt from 'jsonwebtoken';

export const auth = new Hono();
const SECRET = process.env.JWT_SECRET || 'change-me';

auth.get('/me', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'missing-token' }, 401);
  try {
    const payload = jwt.verify(token, SECRET) as any;
    const u = await db.query.users.findFirst({ where: eq(users.id, payload.sub) });
    if (!u) return c.json({ error: 'no-user' }, 404);
    return c.json({ user: u });
  } catch {
    return c.json({ error: 'invalid-token' }, 401);
  }
});

auth.post('/dev-login', async (c) => {
  // Dev-only: skip OAuth, accept email
  if (process.env.NODE_ENV === 'production') return c.json({ error: 'disabled' }, 403);
  const { email, name } = await c.req.json();
  if (!email) return c.json({ error: 'email-required' }, 400);
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  let user = existing;
  if (!user) {
    const [created] = await db.insert(users).values({ email, name }).returning();
    user = created;
  }
  const token = jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: '7d' });
  return c.json({ token, user });
});

auth.get('/google/url', (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: 'userId-required' }, 400);
  return c.json({ url: authorizeUrl(userId) });
});

auth.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const userId = c.req.query('state');
  if (!code || !userId) return c.json({ error: 'invalid-request' }, 400);
  const tokens = await exchangeCode(code);
  const cfg = encrypt(JSON.stringify(tokens));
  await db.insert(sources).values({
    userId,
    type: 'gmail',
    label: 'Gmail',
    encryptedConfig: cfg,
  });
  const web = process.env.WEB_URL ?? 'http://localhost:3000';
  return c.redirect(`${web}/sources?connected=gmail`);
});
