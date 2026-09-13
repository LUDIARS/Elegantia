import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { ServerConfig } from '../runtime/config.js';
import type { HumanReviews } from '../db/human-reviews.js';
import type { Catalog } from '../../shared/catalog.js';
import { humanReviewSchema } from '../../shared/local.js';
import { registeredProjects } from '../projects/registry.js';
import { IdempotencyConflict } from '../db/repository.js';
import { projectPage } from '../projects/page.js';
export function localRouter(config: ServerConfig, reviews: HumanReviews, catalog: Catalog): Hono {
  const app = new Hono();
  app.use('*', bodyLimit({ maxSize: config.maxPayloadBytes }));
  app.get('/projects', async c => {
    const offset = Number(c.req.query('offset') ?? '0');
    if (!Number.isSafeInteger(offset) || offset < 0) return c.json({ error: 'Invalid offset' }, 400);
    return c.json(projectPage(await registeredProjects(config.root), reviews.updates(), offset));
  });
  app.get('/reviews', c => {
    const project = c.req.query('project'), itemId = c.req.query('itemId');
    const cursor = c.req.query('cursor') === undefined ? undefined : Number(c.req.query('cursor'));
    if (!project || project.length > 160 || !catalog.items.some(item => item.id === itemId)
      || (cursor !== undefined && (!Number.isSafeInteger(cursor) || cursor < 1))) return c.json({ error: 'Invalid review query' }, 400);
    const history = reviews.history(project, itemId!, cursor);
    return c.json({ reviews: history, nextCursor: history.length === 50 ? history[49].sequence : null });
  });
  app.post('/reviews', async c => {
    if (!c.req.header('origin')) return c.json({ error: 'Origin required' }, 403);
    if (!c.req.header('content-type')?.startsWith('application/json')) return c.json({ error: 'JSON required' }, 415);
    const body = await c.req.text();
    if (Buffer.byteLength(body, 'utf8') > config.maxPayloadBytes) return c.json({ error: 'Payload too large' }, 413);
    let raw: unknown;
    try { raw = JSON.parse(body); } catch { return c.json({ error: 'Invalid JSON' }, 400); }
    const parsed = humanReviewSchema.safeParse(raw);
    if (!parsed.success || !catalog.items.some(item => item.id === parsed.data.itemId)) return c.json({ error: 'Invalid review' }, 400);
    if (!(await registeredProjects(config.root)).some(project => project.project === parsed.data.project))
      return c.json({ error: 'Project is not registered' }, 400);
    try { reviews.append(parsed.data); }
    catch (error) { if (error instanceof IdempotencyConflict) return c.json({ error: 'Request ID conflict' }, 409); throw error; }
    return c.json({ ok: true });
  });
  return app;
}
