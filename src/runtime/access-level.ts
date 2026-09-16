import type { AccessLevel } from '../../shared/local.js';
import type { CfAccessVerifier } from './cf-access.js';
import { isLocalAccess } from './local-access.js';

export interface AccessInput {
  mode: 'public' | 'local'; port: number;
  host: string | undefined; origin: string | undefined;
  assertion: string | undefined; verifier?: CfAccessVerifier;
}

/**
 * local: loopback tool with full read/write.
 * viewer: request carried a Cloudflare Access token that verified; read-only.
 * public: catalog and templates only.
 */
export async function resolveAccessLevel(input: AccessInput): Promise<AccessLevel> {
  if (isLocalAccess(input.mode, input.port, input.host, input.origin)) return 'local';
  if (input.verifier && await input.verifier.verify(input.assertion)) return 'viewer';
  return 'public';
}

export function allowsMethod(level: AccessLevel, method: string): boolean {
  if (level === 'local') return true;
  if (level === 'viewer') return method === 'GET' || method === 'HEAD';
  return false;
}
