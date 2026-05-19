import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'missing-token' }, 401);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me') as any;
    c.set('userId', payload.sub);
    await next();
  } catch {
    return c.json({ error: 'invalid-token' }, 401);
  }
}
