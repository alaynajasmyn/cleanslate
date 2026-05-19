/**
 * IMAP connector — universal email source for non-Google providers.
 * Wraps `node-imap` with a clean async API.
 */
import Imap from 'node-imap';
import { simpleParser } from 'mailparser';

export interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port?: number;
  tls?: boolean;
}

export interface ImapMessage {
  uid: number;
  from: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: Date;
}

export class ImapConnector {
  constructor(private cfg: ImapConfig) {}

  async fetchSince(since: Date, mailbox = 'INBOX'): Promise<ImapMessage[]> {
    return new Promise((resolve, reject) => {
      const conn = new Imap({
        user: this.cfg.user,
        password: this.cfg.password,
        host: this.cfg.host,
        port: this.cfg.port ?? 993,
        tls: this.cfg.tls ?? true,
        tlsOptions: { rejectUnauthorized: false },
      });
      const out: ImapMessage[] = [];

      conn.once('ready', () => {
        conn.openBox(mailbox, true, (err) => {
          if (err) return reject(err);
          conn.search(['ALL', ['SINCE', since]], (sErr, uids) => {
            if (sErr || !uids?.length) {
              conn.end();
              return resolve(out);
            }
            const f = conn.fetch(uids, { bodies: '' });
            f.on('message', (msg, seqno) => {
              msg.on('body', (stream) => {
                simpleParser(stream as any).then((parsed) => {
                  out.push({
                    uid: seqno,
                    from: parsed.from?.text ?? '',
                    subject: parsed.subject ?? '',
                    snippet: (parsed.text ?? '').slice(0, 500),
                    body: parsed.text ?? '',
                    receivedAt: parsed.date ?? new Date(),
                  });
                });
              });
            });
            f.once('end', () => {
              setTimeout(() => {
                conn.end();
                resolve(out);
              }, 200);
            });
          });
        });
      });
      conn.once('error', reject);
      conn.connect();
    });
  }
}
