import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const hasDatabaseConfigured = (): boolean => {
  return Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    (process.env.SQL_HOST && process.env.SQL_USER)
  );
};

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

    if (connectionString) {
      global._postgresPool = new Pool({
        connectionString,
        ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 8000,
      });
    } else if (process.env.SQL_HOST) {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 8000,
      });
    } else {
      // In-memory or fallback mode: create short-timeout pool to prevent serverless freeze
      global._postgresPool = new Pool({
        connectionTimeoutMillis: 1000,
      });
    }

    global._postgresPool.on('error', (err) => {
      console.warn('Postgres pool warning:', err?.message || err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
