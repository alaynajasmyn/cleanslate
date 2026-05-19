import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './routes/auth.js';
import { sources } from './routes/sources.js';
import { subs } from './routes/subscriptions.js';
import { actions } from './routes/actions.js';
import { ingest } from './routes/ingest.js';

const app = new Hono();
app.use('*', logger());
app.use('*', cors({ origin: process.env.WEB_URL ?? 'http://localhost:3000', credentials: true }));

app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));
app.route('/auth', auth);
app.route('/sources', sources);
app.route('/subscriptions', subs);
app.route('/actions', actions);
app.route('/ingest', ingest);

const port = Number(process.env.API_PORT ?? 8080);
console.log(`api listening :${port}`);
export default { port, fetch: app.fetch };
