import { resolve } from 'node:path';
import { Server } from 'node:http';
import { access } from 'node:fs/promises';
import { serve } from '@hono/node-server';
import { loadConfig } from './runtime/config.js';
import { createLogger } from './runtime/logger.js';
import { loadCatalog } from './catalog/load.js';
import { connectDatabase } from './db/connect.js';
import { ResultRepository } from './db/repository.js';
import { HumanReviews } from './db/human-reviews.js';
import { createApp } from './http/app.js';
import { attachSocket } from './http/socket.js';
import { CfAccessVerifier } from './runtime/cf-access.js';

async function main(): Promise<void> {
  const root = process.cwd();
  const config = await loadConfig(root, process.env);
  config.catalogPath = resolve(root, config.catalogPath);
  config.documentPath = resolve(root, config.documentPath);
  config.staticRoot = resolve(root, config.staticRoot);
  await access(resolve(config.staticRoot, 'index.html'));
  await access(config.documentPath);
  const catalog = await loadCatalog(config.catalogPath);
  const logger = createLogger(resolve(root, config.logsDir));
  let database: Awaited<ReturnType<typeof connectDatabase>>;
  try { database = await connectDatabase(config.databasePath, resolve(root, 'migrations/001_results.sql')); }
  catch (error) { logger.write({ level: 'error', msg: 'Database initialization failed' }); await logger.close(); throw error; }
  const repository = new ResultRepository(database.db, () => new Date());
  const cfAccess = config.cfAccess ? new CfAccessVerifier(config.cfAccess) : undefined;
  const app = createApp({ config, catalog, repository, logger, ping: database.ping, reviews: new HumanReviews(database.db, () => new Date()), cfAccess });
  const server = serve({ fetch: app.fetch, hostname: config.host, port: config.port });
  if (!(server instanceof Server)) {
    server.close(); await database.close(); await logger.close();
    throw new Error('HTTP/1 server required');
  }
  const socket = attachSocket({ server, mode: config.mode, port: config.port, origins: config.origins, hosts: config.hosts, maxPayloadBytes: config.maxPayloadBytes,
    maxImportRecords: config.maxImportRecords, repository, catalog, logger, now: () => new Date() });
  let stopping = false;
  async function shutdown(code: number): Promise<void> {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), config.shutdownTimeoutMs);
    try {
      await socket.close();
      await new Promise<void>(resolveClose => server.close(() => resolveClose()));
      await database.close();
      logger.write({ msg: 'Elegantia stopped' });
      await logger.close();
      process.exitCode = code;
    } catch {
      process.stderr.write('Elegantia could not finish shutdown.\n');
      process.exitCode = 1;
    } finally { clearTimeout(deadline); }
  }
  server.once('listening', () => logger.write({ msg: 'Elegantia listening', ctx: { port: config.port, access: config.access } }));
  server.on('error', () => { logger.write({ level: 'error', msg: 'HTTP listener failed' }); void shutdown(1); });
  process.once('SIGINT', () => { void shutdown(0); });
  process.once('SIGTERM', () => { void shutdown(0); });
  process.once('uncaughtException', () => { logger.write({ level: 'error', msg: 'Uncaught exception' }); void shutdown(1); });
  process.once('unhandledRejection', () => { logger.write({ level: 'error', msg: 'Unhandled rejection' }); void shutdown(1); });
}
main().catch(() => {
  // Configuration may be unavailable before the shared logger can be created.
  process.stderr.write('Elegantia startup failed. Check config, database connection, and built assets.\n');
  process.exitCode = 1;
});
