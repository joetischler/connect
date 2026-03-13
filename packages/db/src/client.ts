import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export function createDb(connectionString?: string) {
  const url = connectionString ?? process.env['DATABASE_URL'] ?? 'postgresql://connect:connect@localhost:5432/connect';
  const sql = postgres(url);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;
