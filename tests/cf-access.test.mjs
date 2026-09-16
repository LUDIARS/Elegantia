import assert from 'node:assert/strict';
import test from 'node:test';
import { generateKeyPairSync, sign } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { CfAccessVerifier, cfAccessConfig } from '../dist/src/runtime/cf-access.js';
import { resolveAccessLevel, allowsMethod } from '../dist/src/runtime/access-level.js';
import { loadConfig } from '../dist/src/runtime/config.js';
import { loadCatalog } from '../dist/src/catalog/load.js';
import { createApp } from '../dist/src/http/app.js';

const teamDomain = 'https://example.cloudflareaccess.com';
const audience = 'a'.repeat(64);
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'kid-1', use: 'sig', alg: 'RS256' };
const nowSeconds = () => Math.floor(Date.now() / 1000);
const base64url = value => Buffer.from(JSON.stringify(value)).toString('base64url');
function token(claims, header = { alg: 'RS256', kid: 'kid-1' }, key = privateKey) {
  const input = base64url(header) + '.' + base64url({ iss: teamDomain, aud: [audience], exp: nowSeconds() + 300, iat: nowSeconds(), email: 'viewer@example.test', ...claims });
  return input + '.' + sign('RSA-SHA256', Buffer.from(input), key).toString('base64url');
}
const fetchJwks = async () => ({ keys: [jwk] });
const verifier = () => new CfAccessVerifier({ teamDomain, audience }, fetchJwks);

test('config requires the team domain and audience together', () => {
  assert.equal(cfAccessConfig({}), undefined);
  assert.throws(() => cfAccessConfig({ ELEGANTIA_CF_ACCESS_TEAM_DOMAIN: teamDomain }));
  assert.throws(() => cfAccessConfig({ ELEGANTIA_CF_ACCESS_TEAM_DOMAIN: 'http://example.cloudflareaccess.com', ELEGANTIA_CF_ACCESS_AUD: audience }));
  assert.throws(() => cfAccessConfig({ ELEGANTIA_CF_ACCESS_TEAM_DOMAIN: teamDomain, ELEGANTIA_CF_ACCESS_AUD: 'not-a-tag' }));
  assert.throws(() => cfAccessConfig({ ELEGANTIA_CF_ACCESS_TEAM_DOMAIN: teamDomain + '/', ELEGANTIA_CF_ACCESS_AUD: audience }));
  assert.deepEqual(cfAccessConfig({ ELEGANTIA_CF_ACCESS_TEAM_DOMAIN: teamDomain, ELEGANTIA_CF_ACCESS_AUD: audience }), { teamDomain, audience });
});

test('a token signed by the team key for this application verifies; tampered or foreign tokens do not', async () => {
  const cf = verifier();
  assert.deepEqual(await cf.verify(token({})), { email: 'viewer@example.test' });
  assert.equal(await cf.verify(undefined), undefined);
  assert.equal(await cf.verify('not.a.jwt'), undefined);
  assert.equal(await cf.verify(token({ aud: ['b'.repeat(64)] })), undefined, 'other application');
  assert.equal(await cf.verify(token({ iss: 'https://other.cloudflareaccess.com' })), undefined, 'other team');
  assert.equal(await cf.verify(token({ exp: nowSeconds() - 1 })), undefined, 'expired');
  assert.equal(await cf.verify(token({ nbf: nowSeconds() + 600 })), undefined, 'not yet valid');
  assert.equal(await cf.verify(token({}, { alg: 'none', kid: 'kid-1' })), undefined, 'alg none');
  assert.equal(await cf.verify(token({}, { alg: 'RS256', kid: 'unknown' })), undefined, 'unknown key id');
  const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
  assert.equal(await cf.verify(token({}, undefined, other)), undefined, 'foreign signature');
  const [h, p, s] = token({}).split('.');
  assert.equal(await cf.verify(h + '.' + base64url({ iss: teamDomain, aud: [audience], exp: nowSeconds() + 300, email: 'x@example.test' }) + '.' + s), undefined, 'payload swap');
});

test('JWKS failures deny access instead of throwing', async () => {
  const failing = new CfAccessVerifier({ teamDomain, audience }, async () => { throw new Error('offline'); });
  assert.equal(await failing.verify(token({})), undefined);
  const malformed = new CfAccessVerifier({ teamDomain, audience }, async () => ({ nope: true }));
  assert.equal(await malformed.verify(token({})), undefined);
});

test('access level: local beats viewer, viewer is read-only, public stays public without a verifier', async () => {
  const base = { mode: 'public', port: 17860, host: 'el.example.test', origin: undefined };
  assert.equal(await resolveAccessLevel({ ...base, assertion: token({}), verifier: verifier() }), 'viewer');
  assert.equal(await resolveAccessLevel({ ...base, assertion: token({}) }), 'public');
  assert.equal(await resolveAccessLevel({ ...base, mode: 'local', host: 'localhost:17860', assertion: undefined, verifier: verifier() }), 'local');
  assert.equal(allowsMethod('viewer', 'GET'), true);
  assert.equal(allowsMethod('viewer', 'POST'), false);
  assert.equal(allowsMethod('public', 'GET'), false);
});

test('HTTP: a verified Cloudflare Access token reads evaluations from the public host; writes and untrusted tokens are refused', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const config = await loadConfig(root, { ELEGANTIA_PUBLIC_URL: 'https://el.example.test', ELEGANTIA_CF_ACCESS_TEAM_DOMAIN: teamDomain, ELEGANTIA_CF_ACCESS_AUD: audience });
  const catalog = await loadCatalog(root + '/data/catalog.json');
  const repository = { contexts: async () => [{ product: 'private', build: '1', environment: 'x' }] };
  const app = createApp({ config, catalog, repository, reviews: { history: () => [] }, logger: { write() {} }, ping: async () => {}, cfAccess: verifier() });
  const request = (path, init = {}) => app.request('https://el.example.test' + path, { ...init, headers: { host: 'el.example.test', ...(init.headers ?? {}) } });
  const runtime = await request('/api/runtime', { headers: { 'cf-access-jwt-assertion': token({}) } });
  assert.deepEqual(await runtime.json(), { mode: 'viewer' });
  assert.deepEqual(await (await request('/api/runtime')).json(), { mode: 'public' });
  const contexts = await request('/api/contexts', { headers: { 'cf-access-jwt-assertion': token({}) } });
  assert.equal(contexts.status, 200);
  const reviews = await request('/api/local/reviews?project=private&itemId=C01', { headers: { 'cf-access-jwt-assertion': token({}) } });
  assert.equal(reviews.status, 200);
  assert.equal((await request('/api/contexts')).status, 403, 'no token');
  assert.equal((await request('/api/contexts', { headers: { 'cf-access-jwt-assertion': token({ exp: nowSeconds() - 1 }) } })).status, 403, 'expired token');
  const write = await request('/api/local/reviews', { method: 'POST', headers: { 'cf-access-jwt-assertion': token({}), origin: 'https://el.example.test', 'content-type': 'application/json' }, body: '{}' });
  assert.equal(write.status, 403, 'viewer cannot write');
});
