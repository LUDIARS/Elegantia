import { mkdir, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
export interface Database {
  db: DatabaseSync;
  ping(): Promise<void>;
  close(): Promise<void>;
}
export async function connectDatabase(filename: string, migrationPath: string): Promise<Database> {
  const directory = dirname(migrationPath);
  const names = (await readdir(directory)).filter(name => /^\d{3}_[a-z_]+\.sql$/.test(name)).sort();
  if (!names.length) throw new Error('No database migrations found');
  const migration = (await Promise.all(names.map(name => readFile(join(directory, name), 'utf8')))).join('\n');
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
