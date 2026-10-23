import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { Client } from '@libsql/client';
import * as schema from './db/schema.js';

export type AppDatabase = LibSQLDatabase<typeof schema>;

declare module 'fastify' {
  interface FastifyInstance {
    db: AppDatabase;
    dbClient?: Client;
  }
}
