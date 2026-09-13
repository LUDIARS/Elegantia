import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import type { LocalProject } from '../../shared/local.js';
const registrySchema = z.object({ entries: z.array(z.object({
  code: z.string(), project: z.string().min(1).max(160), updated_at: z.number().nonnegative(),
})) });
const catalogSchema = z.object({ services: z.array(z.object({ code: z.string(), port: z.number().int().min(1).max(65535) })) });
/** Read the local coordinator's registry; never disclose paths or team metadata. */
export async function registeredProjects(root: string): Promise<LocalProject[]> {
  const catalog = catalogSchema.parse(parse(await readFile(resolve(dirname(root), 'Concordia/excubitor.catalog.yaml'), 'utf8')));
  const services = catalog.services.filter(service => service.code === 'concordia');
  if (services.length !== 1) throw new Error('Concordia catalog must identify one registry service');
  const response = await fetch('http://127.0.0.1:' + services[0].port + '/v1/project-codes/admin', { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('Local project registry is unavailable');
  return registrySchema.parse(await response.json()).entries.map(entry => ({ code: entry.code, project: entry.project, updatedAt: entry.updated_at }));
}
