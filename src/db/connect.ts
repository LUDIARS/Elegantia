import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

export interface Database {
  db: NodePgDatabase<typeof schema>;
  ping(): Promise<void>;
  close(): Promise<void>;
}
export async function connectDatabase(connectionString: string, migrationPath: string, onError: () => void): Promise<Database> {
  const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000, statement_timeout: 10000 });
  pool.on('error', onError);
  try {
    const migration = await readFile(migrationPath, 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('elegantia-schema'))");
      await client.query(migration);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
    return {
      db: drizzle(pool, { schema }),
      async ping(): Promise<void> { await pool.query('SELECT 1'); },
      async close(): Promise<void> { await pool.end(); },
    };
  } catch (error) {
    await pool.end();
    throw error;
  }
}
