import { readFile, writeFile } from 'node:fs/promises';
import { librarySchema } from '../shared/library.ts';
const root = new URL('../', import.meta.url);
const source = JSON.parse(await readFile(new URL('config/library.json', root), 'utf8'));
const manifest = librarySchema.parse({ ...source, entries: source.entries.map(entry => ({ ...entry, markdown: 'pending' })) });
const catalog = JSON.parse(await readFile(new URL('data/catalog.json', root), 'utf8'));
const ids = new Set(catalog.items.map(item => item.id));
if (new Set(manifest.entries.map(entry => entry.id)).size !== manifest.entries.length) throw new Error('Duplicate template IDs');
for (const entry of manifest.entries) {
  if (entry.qualityIds.some(id => !ids.has(id))) throw new Error('Unknown quality reference in ' + entry.id);
  entry.markdown = await readFile(new URL(entry.path.split('/').map(encodeURIComponent).join('/'), root), 'utf8');
}
await writeFile(new URL('data/library.json', root), JSON.stringify(librarySchema.parse(manifest), null, 2) + '\n', 'utf8');
process.stdout.write(manifest.entries.length + ' advisory / quality / UX templates compiled\n');
