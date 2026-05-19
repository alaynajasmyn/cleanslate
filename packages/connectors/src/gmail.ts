/**
 * Gmail connector via googleapis. OAuth tokens stored encrypted on `sources` table.
 */
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: Date;
}

export function makeOAuthClient(): OAuth2Client {
  const o = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
  return o;
}

export function authorizeUrl(state: string): string {
  const o = makeOAuthClient();
  return o.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    state,
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });
}

export async function exchangeCode(code: string) {
  const o = makeOAuthClient();
  const { tokens } = await o.getToken(code);
  return tokens;
}

export class GmailConnector {
  private o: OAuth2Client;
  constructor(creds: { access_token: string; refresh_token: string }) {
    this.o = makeOAuthClient();
    this.o.setCredentials(creds);
  }

  async listMessages({ since, query }: { since?: Date; query?: string } = {}): Promise<string[]> {
    const gmail = google.gmail({ version: 'v1', auth: this.o });
    const q = [
      query,
      since ? `after:${Math.floor(since.getTime() / 1000)}` : '',
      // Bias toward financial / sub-related
      '(receipt OR invoice OR subscription OR renewal OR "trial ends" OR "auto-renew" OR "thank you for your purchase" OR tagihan OR langganan)',
    ]
      .filter(Boolean)
      .join(' ');
    const r = await gmail.users.messages.list({ userId: 'me', q, maxResults: 200 });
    return (r.data.messages ?? []).map((m) => m.id!).filter(Boolean);
  }

  async fetchMessage(id: string): Promise<GmailMessage> {
    const gmail = google.gmail({ version: 'v1', auth: this.o });
    const r = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
    const headers = (r.data.payload?.headers ?? []) as Array<{ name: string; value: string }>;
    const get = (n: string) => headers.find((h) => h.name.toLowerCase() === n.toLowerCase())?.value ?? '';
    const body = decodeBody(r.data.payload);
    return {
      id,
      threadId: r.data.threadId ?? '',
      from: get('From'),
      subject: get('Subject'),
      snippet: r.data.snippet ?? '',
      body,
      receivedAt: new Date(Number(r.data.internalDate ?? 0)),
    };
  }
}

function decodeBody(part: any): string {
  if (!part) return '';
  if (part.body?.data) {
    return Buffer.from(part.body.data, 'base64').toString('utf8');
  }
  for (const p of part.parts ?? []) {
    if (p.mimeType === 'text/plain' && p.body?.data) {
      return Buffer.from(p.body.data, 'base64').toString('utf8');
    }
  }
  for (const p of part.parts ?? []) {
    const inner = decodeBody(p);
    if (inner) return inner;
  }
  return '';
}
