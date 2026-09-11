import { readFile } from 'node:fs/promises';
import { catalogSchema, type Catalog } from '../../shared/catalog.js';

export async function loadCatalog(path: string): Promise<Catalog> {
  return catalogSchema.parse(JSON.parse(await readFile(path, 'utf8')));
}
