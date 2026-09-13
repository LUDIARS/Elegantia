import { test } from 'node:test';
import assert from 'node:assert/strict';
import { injectedHosts, matchesHost } from '../dist/src/runtime/allowed-hosts.js';
import { allowedUpgrade } from '../dist/src/http/access.js';

test('Ex injected host syntax and domain boundaries', () => {
  const hosts = new Set(['127.0.0.1:17860', ...injectedHosts(' .example.test, exact.test, ')]);
  for (const host of ['127.0.0.1:17860', 'example.test', 'Ex.example.test:443', 'exact.test'])
    assert.equal(matchesHost(host, hosts), true, host);
  for (const host of [undefined, '127.0.0.1:9999', 'badexample.test', 'example.test.evil.test',
    'sub.exact.test', 'exact.test@evil.test', 'exact.test/path', 'exact.test,evil.test', 'exact.test:bad'])
    assert.equal(matchesHost(host, hosts), false, String(host));
  assert.deepEqual(injectedHosts(undefined), []);
  for (const value of ['*', 'https://example.test', '.']) assert.throws(() => injectedHosts(value));
});

test('WebSocket host injection preserves origin and peer restrictions', () => {
  const hosts = new Set(injectedHosts('.example.test'));
  const origins = new Set(['https://ex.example.test']);
  const request = { headers: { host: 'ex.example.test', origin: 'https://ex.example.test' },
    socket: { remoteAddress: '127.0.0.1' } };
  assert.equal(allowedUpgrade(request, origins, hosts), true);
  assert.equal(allowedUpgrade({ ...request, headers: { ...request.headers, origin: 'https://other.example.test' } }, origins, hosts), false);
  assert.equal(allowedUpgrade({ ...request, socket: { remoteAddress: '192.0.2.1' } }, origins, hosts), false);
});
