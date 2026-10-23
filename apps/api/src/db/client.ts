import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema.js';
import { config } from '../config.js';

export function getLibsqlUrl(rawPath: string): string {
  if (rawPath === ':memory:' || rawPath === 'file::memory:') {
    return 'file::memory:';
  }
  if (rawPath.startsWith('file:') || rawPath.startsWith('libsql:') || rawPath.startsWith('http:') || rawPath.startsWith('https:')) {
    return rawPath;
  }
  return `file:${rawPath}`;
}

export function initLibsqlClient(rawPath = config.DATABASE_PATH): Client {
  const url = getLibsqlUrl(rawPath);
  return createClient({ url });
}

export async function ensureTables(client: Client): Promise<void> {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      organizer TEXT NOT NULL,
      description TEXT NOT NULL,
      benefits TEXT NOT NULL,
      fee INTEGER NOT NULL,
      additional_costs_note TEXT,
      travel_info TEXT NOT NULL,
      mode TEXT NOT NULL,
      city TEXT,
      skills TEXT NOT NULL,
      topics TEXT NOT NULL,
      level TEXT NOT NULL,
      eligibility TEXT NOT NULL,
      deadline TEXT NOT NULL,
      event_date TEXT,
      application_url TEXT,
      source_url TEXT,
      verification TEXT NOT NULL,
      last_checked_at TEXT,
      is_demo INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      removed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL REFERENCES opportunities(id),
      reason TEXT NOT NULL,
      details TEXT,
      contact_email TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      submitter_email TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      reviewed_at TEXT
    );
  `);
}

export function createDb(clientInstance?: Client): { db: LibSQLDatabase<typeof schema>; client: Client } {
  const client = clientInstance || initLibsqlClient();
  const db = drizzle(client, { schema });
  return { db, client };
}

export const defaultConnection = createDb();
export const db = defaultConnection.db;
export const client = defaultConnection.client;
