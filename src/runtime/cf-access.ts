import type { JsonWebKey } from 'node:crypto';
import { decodeJwt, verifyRs256 } from './cf-jwt.js';

export interface CfAccessConfig { teamDomain: string; audience: string }
export interface CfIdentity { email?: string }
export type JwksFetcher = (url: string) => Promise<unknown>;

const audienceTag = /^[a-f0-9]{32,128}$/i;
/** Both settings or neither. A half-configured gate must fail at startup, not silently stay public. */
export function cfAccessConfig(env: NodeJS.ProcessEnv): CfAccessConfig | undefined {
  const teamDomain = env.ELEGANTIA_CF_ACCESS_TEAM_DOMAIN?.trim();
  const audience = env.ELEGANTIA_CF_ACCESS_AUD?.trim();
  if (!teamDomain && !audience) return undefined;
  if (!teamDomain || !audience) throw new Error('ELEGANTIA_CF_ACCESS_TEAM_DOMAIN and ELEGANTIA_CF_ACCESS_AUD must be set together');
  let url: URL;
  try { url = new URL(teamDomain); } catch { throw new Error('Invalid Cloudflare Access team domain'); }
  if (url.protocol !== 'https:' || url.origin !== teamDomain) throw new Error('Invalid Cloudflare Access team domain');
  if (!audienceTag.test(audience)) throw new Error('Invalid Cloudflare Access audience tag');
  return { teamDomain, audience };
}

const KEY_TTL_MS = 10 * 60 * 1000;
const UNKNOWN_KID_RETRY_MS = 60 * 1000;
const MAX_ASSERTION_LENGTH = 8192;

async function fetchJwksDefault(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('JWKS fetch failed');
  return response.json();
}

function claimsAccepted(payload: Record<string, unknown>, config: CfAccessConfig, nowMs: number): boolean {
  const now = Math.floor(nowMs / 1000);
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  return payload.iss === config.teamDomain && audiences.includes(config.audience)
    && typeof payload.exp === 'number' && payload.exp > now
    && (payload.nbf === undefined || (typeof payload.nbf === 'number' && payload.nbf <= now));
}

/** Verifies Cloudflare Access application tokens against the team's published signing keys. */
export class CfAccessVerifier {
  private readonly keys = new Map<string, JsonWebKey>();
  private fetchedAt = -Infinity;
  private inflight?: Promise<void>;
  constructor(private readonly config: CfAccessConfig, private readonly fetchJwks: JwksFetcher = fetchJwksDefault,
    private readonly now: () => number = () => Date.now()) {}

  async verify(assertion: string | undefined): Promise<CfIdentity | undefined> {
    if (!assertion || assertion.length > MAX_ASSERTION_LENGTH) return undefined;
    const parts = decodeJwt(assertion);
    if (!parts || typeof parts.header.kid !== 'string') return undefined;
    const key = await this.keyFor(parts.header.kid);
    if (!key || !verifyRs256(parts, key) || !claimsAccepted(parts.payload, this.config, this.now())) return undefined;
    return { email: typeof parts.payload.email === 'string' ? parts.payload.email : undefined };
  }

  private async keyFor(kid: string): Promise<JsonWebKey | undefined> {
    const age = this.now() - this.fetchedAt;
    if (!this.keys.size || age > KEY_TTL_MS) await this.refresh();
    if (!this.keys.has(kid) && this.now() - this.fetchedAt > UNKNOWN_KID_RETRY_MS) await this.refresh();
    return this.keys.get(kid);
  }

  private refresh(): Promise<void> {
    this.inflight ??= this.load().finally(() => { this.inflight = undefined; });
    return this.inflight;
  }

  private async load(): Promise<void> {
    let body: unknown;
    try { body = await this.fetchJwks(this.config.teamDomain + '/cdn-cgi/access/certs'); }
    catch { this.fetchedAt = this.now(); return; }
    const keys = typeof body === 'object' && body !== null && Array.isArray((body as { keys?: unknown }).keys)
      ? (body as { keys: unknown[] }).keys : [];
    this.keys.clear();
    for (const key of keys) {
      if (typeof key !== 'object' || key === null) continue;
      const jwk = key as JsonWebKey & { kid?: unknown };
      if (typeof jwk.kid === 'string' && jwk.kty === 'RSA') this.keys.set(jwk.kid, jwk);
    }
    this.fetchedAt = this.now();
  }
}
