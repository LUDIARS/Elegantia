import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

const configSchema = z.object({
  host: z.literal('127.0.0.1'), access: z.literal('loopback-and-exview'),
  catalogPath: z.string().min(1), documentPath: z.string().min(1),
  staticRoot: z.string().min(1), logsDir: z.string().min(1),
  databaseEnv: z.string().min(1), maxImportRecords: z.number().int().min(1).max(500),
  maxPayloadBytes: z.number().int().positive(), shutdownTimeoutMs: z.number().int().positive(),
}).strict();
const fragmentSchema = z.object({ services: z.array(z.object({ code: z.string(), port: z.number().int().min(1).max(65535) })) });
export interface ServerConfig extends z.infer<typeof configSchema> {
  root: string; port: number; databaseUrl: string; origins: Set<string>; hosts: Set<string>; viewerOrigins: string[];
}
export async function loadConfig(root: string, env: NodeJS.ProcessEnv): Promise<ServerConfig> {
  const config = configSchema.parse(JSON.parse(await readFile(resolve(root, 'config/server.json'), 'utf8')));
  const fragment = fragmentSchema.parse(parse(await readFile(resolve(root, 'excubitor.catalog.yaml'), 'utf8')));
  const services = fragment.services.filter(service => service.code === 'elegantia');
  if (services.length !== 1) throw new Error('Exactly one elegantia service must be declared');
  const port = services[0].port;
  const databaseUrl = env[config.databaseEnv];
  if (!databaseUrl || !/^postgres(?:ql)?:\/\//.test(databaseUrl))
    throw new Error('Dedicated PostgreSQL connection is required via ' + config.databaseEnv);
  const viewerOrigins = (env.ELEGANTIA_VIEWER_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean);
  for (const origin of viewerOrigins) {
    const url = new URL(origin);
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid Viewer origin');
  }
  const hosts = new Set(['http://127.0.0.1:' + port, 'http://localhost:' + port]);
  return { ...config, root, port, databaseUrl, hosts, viewerOrigins,
    origins: new Set([...hosts, ...viewerOrigins]) };
}
