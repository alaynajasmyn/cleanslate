import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';

const url = process.env.DATABASE_URL || 'postgresql://cleanslate:cleanslate@localhost:5432/cleanslate';
const sql = postgres(url, { max: 10 });
export const db = drizzle(sql, { schema });
export * from './schema.js';
