import {
  pgTable, uuid, text, timestamp, doublePrecision, integer, boolean, jsonb, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash'),
  tier: text('tier').default('free').notNull(), // free | pro | pro_plus
  baseCurrency: text('base_currency').default('USD').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sources = pgTable(
  'sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    type: text('type').notNull(), // gmail | imap | plaid | brick | csv | manual
    label: text('label'),
    encryptedConfig: text('encrypted_config').notNull(), // ciphertext
    enabled: boolean('enabled').default(true).notNull(),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ uIdx: index('sources_user_idx').on(t.userId) }),
);

export const charges = pgTable(
  'charges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    sourceId: uuid('source_id').references(() => sources.id, { onDelete: 'set null' }),
    sourceRef: text('source_ref').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    amount: doublePrecision('amount').notNull(),
    currency: text('currency').notNull(),
    rawDescriptor: text('raw_descriptor').notNull(),
    normalizedVendor: text('normalized_vendor'),
    subscriptionId: uuid('subscription_id'),
  },
  (t) => ({
    uByRef: uniqueIndex('charges_source_ref_uniq').on(t.userId, t.sourceRef),
    timeIdx: index('charges_user_time_idx').on(t.userId, t.occurredAt),
  }),
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    vendor: text('vendor').notNull(),
    vendorDomain: text('vendor_domain'),
    category: text('category'),
    amount: doublePrecision('amount').notNull(),
    currency: text('currency').notNull(),
    cadence: text('cadence').notNull(),
    status: text('status').default('active').notNull(),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    nextChargeAt: timestamp('next_charge_at', { withTimezone: true }),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    detectedFrom: text('detected_from').notNull(),
    confidence: doublePrecision('confidence').default(0).notNull(),
    notes: text('notes'),
  },
  (t) => ({ uByVendor: uniqueIndex('subs_vendor_uniq').on(t.userId, t.vendor) }),
);

export const anomalies = pgTable(
  'anomalies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    kind: text('kind').notNull(),
    severity: text('severity').default('warn').notNull(),
    subject: text('subject').notNull(),
    detail: text('detail').notNull(),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => ({ openIdx: index('anomalies_open_idx').on(t.userId, t.resolvedAt) }),
);

export const actions = pgTable(
  'actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    kind: text('kind').notNull(),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
    status: text('status').default('suggested').notNull(),
    draftBody: text('draft_body'),
    channel: text('channel'),
    expectedSavingsUsd: doublePrecision('expected_savings_usd'),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ statusIdx: index('actions_status_idx').on(t.userId, t.status) }),
);

export const emailRecords = pgTable(
  'email_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    sourceId: uuid('source_id').references(() => sources.id, { onDelete: 'cascade' }),
    messageId: text('message_id').notNull(),
    fromAddr: text('from_addr').notNull(),
    subject: text('subject').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
    redactedSnippet: text('redacted_snippet').notNull(),
    classified: text('classified').default('other').notNull(),
    vendorGuess: text('vendor_guess'),
    amountGuess: doublePrecision('amount_guess'),
  },
  (t) => ({ uMsg: uniqueIndex('email_msg_uniq').on(t.userId, t.messageId) }),
);

export const usersRel = relations(users, ({ many }) => ({
  sources: many(sources),
  charges: many(charges),
  subscriptions: many(subscriptions),
}));
