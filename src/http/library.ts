import { Hono } from 'hono';
import { readFile } from 'node:fs/promises';
import { librarySchema } from '../../shared/library.js';
export function libraryRouter(root: string): Hono {
  const app = new Hono();
  const load = async () => librarySchema.parse(JSON.parse(await readFile(root + '/data/library.json', 'utf8')));
  app.get('/', async c => c.json(await load()));
  app.get('/:id/document', async c => {
    const entry = (await load()).entries.find(row => row.id === c.req.param('id'));
    if (!entry) return c.json({ error: 'Unknown template' }, 404);
    c.header('Content-Disposition', 'attachment; filename="' + entry.id + '.md"');
    return c.text(entry.markdown);
  });
  return app;
}
