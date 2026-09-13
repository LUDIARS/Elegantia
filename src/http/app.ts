import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFile } from 'node:fs/promises';
import type { Writer } from '@ludiars/vestigium';
import type { Catalog } from '../../shared/catalog.js';
import { buildOverview } from '../../shared/coverage.js';
import { contextSchema } from '../../shared/results.js';
import { ResultRepository } from '../db/repository.js';
import { allowedHost } from './access.js';
import { clientError } from './errors.js';
import type { ServerConfig } from '../runtime/config.js';
import { libraryRouter } from './library.js';

export interface AppDependencies {
  catalog: Catalog; repository: ResultRepository; config: ServerConfig; logger: Writer;
  ping: () => Promise<void>;
}
export function createApp(deps: AppDependencies): Hono {
  const { config, catalog, repository, logger } = deps;
  const app = new Hono();
  app.use('*', async (c, next) => {
    if (!allowedHost(c.req.header('host'), config.hosts)) return c.json({ error: 'Host not allowed' }, 403);
    const origin = c.req.header('origin');
    if (origin && !config.origins.has(origin)) return c.json({ error: 'Origin not allowed' }, 403);
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('Cross-Origin-Resource-Policy', 'same-origin');
    c.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'self' " + config.viewerOrigins.join(' ') + "; base-uri 'self'");
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.onError((error, c) => {
    logger.write({ level: 'error', msg: 'HTTP request failed', ctx: { path: c.req.path, name: error.name } });
    return c.json({ error: clientError(error) }, 500);
  });
  app.get('/api/health', async c => {
    try { await deps.ping(); return c.json({ service: 'elegantia', status: 'ok', version: '0.1.0', catalogVersion: catalog.version }); }
    catch { return c.json({ service: 'elegantia', status: 'database_unavailable' }, 503); }
  });
  app.get('/api/catalog', c => c.json(catalog));
  app.route('/api/library', libraryRouter(config.root));
  app.get('/api/policy', async c => c.json({ markdown: await readFile(config.root + '/quality/assessment-policy.md', 'utf8') }));
  app.get('/api/items/:id/document', async c => {
    const id = c.req.param('id');
    const item = catalog.items.find(item => item.id === id);
    if (!item) return c.json({ error: 'Unknown item' }, 404);
    const filename = item.documentPath.slice(item.documentPath.lastIndexOf('/') + 1);
    const encodedFilename = encodeURIComponent(filename).replace(/['()*]/g, char => '%' + char.charCodeAt(0).toString(16).toUpperCase());
    c.header('Content-Disposition', 'attachment; filename="' + id + '.md"; filename*=UTF-8\'\'' + encodedFilename);
    return c.text(await readFile(config.root + '/' + item.documentPath, 'utf8'));
  });
  app.get('/api/catalog.md', async c => {
    c.header('Content-Disposition', 'attachment; filename="elegantia-catalog.md"');
    return c.text(await readFile(config.documentPath, 'utf8'));
  });
  app.get('/api/contexts', async c => c.json({ contexts: await repository.contexts() }));
  app.get('/api/overview', async c => {
    const parsed = contextSchema.safeParse(c.req.query());
    if (!parsed.success) return c.json({ error: clientError(parsed.error) }, 400);
    return c.json(buildOverview(catalog, await repository.latestForProduct(parsed.data.product), parsed.data));
  });
  app.get('/api/items/:id/results', async c => {
    const itemId = c.req.param('id');
    if (!catalog.items.some(item => item.id === itemId)) return c.json({ error: 'Unknown item' }, 404);
    const product = c.req.query('product')?.trim();
    const rawCursor = c.req.query('cursor');
    const cursor = rawCursor ? Number(rawCursor) : undefined;
    if (!product || product.length > 160 || (cursor !== undefined && (!Number.isSafeInteger(cursor) || cursor < 1)))
      return c.json({ error: 'Invalid product or cursor' }, 400);
    return c.json(await repository.history(product, itemId, cursor));
  });
  app.get('/api/results/export', async c => {
    const parsed = contextSchema.safeParse(c.req.query());
    if (!parsed.success) return c.json({ error: clientError(parsed.error) }, 400);
    c.header('Content-Disposition', 'attachment; filename="elegantia-results.json"');
    return c.json({ schemaVersion: 1, results: await repository.exportContext(parsed.data) });
  });
  app.all('/api/*', c => c.json({ error: 'Not found; writes use /ws module_request' }, 404));
  app.use('/assets/*', serveStatic({ root: config.staticRoot }));
  app.get('*', serveStatic({ path: config.staticRoot + '/index.html' }));
  return app;
}
