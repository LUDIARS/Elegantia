import { mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
export interface Database {
  db: DatabaseSync;
  ping(): Promise<void>;
  close(): Promise<void>;
}
export async function connectDatabase(filename: string, migrationPath: string): Promise<Database> {
  const migration = await readFile(migrationPath, 'utf8');
  await mkdir(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  try {
    db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;');
    db.exec('BEGIN IMMEDIATE');
    try { db.exec(migration); db.exec('COMMIT'); }
    catch (error) { db.exec('ROLLBACK'); throw error; }
    return {
      db,
      async ping(): Promise<void> { db.prepare('SELECT 1').get(); },
      async close(): Promise<void> { db.close(); },
    };
  } catch (error) { db.close(); throw error; }
}