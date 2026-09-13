import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicOrigin} from '../dist/src/runtime/public-origin.js';
import {loadConfig} from '../dist/src/runtime/config.js';
import {allowedHost, allowedUpgrade} from '../dist/src/http/access.js';
import {fileURLToPath} from 'node:url';

test('public URL must be an exact HTTPS origin', () => {
  assert.equal(publicOrigin(undefined), undefined);
  assert.equal(publicOrigin('https://el.example.test'), 'https://el.example.test');
  for (const value of ['', 'http://el.example.test', 'https://el.example.test/',
    'https://user:password@el.example.test', 'https://el${DOMAIN_ROOT}', 'https://el.example.test?x'])
    assert.throws(() => publicOrigin(value));
});

test('deployment URL drives direct Host and Origin, independently of Viewer and shared Host list', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const config = await loadConfig(root, {
    ELEGANTIA_PUBLIC_URL: 'https://custom.example.test',
    LUDIARS_ALLOWED_HOSTS: '.example.test',
    ELEGANTIA_VIEWER_ORIGINS: 'https://viewer.example.test',
  });
  assert.equal(allowedHost('custom.example.test', config.hosts), true);
  assert.equal(config.origins.has('https://custom.example.test'), true);
  assert.equal(config.origins.has('https://other.example.test'), false);
  assert.deepEqual(config.viewerOrigins, ['https://viewer.example.test']);
  assert.equal(allowedUpgrade({headers: {host:'custom.example.test', origin:'https://custom.example.test'},
    socket: {remoteAddress:'127.0.0.1'}}, config.origins, config.hosts), true);
  const local = await loadConfig(root, {});
  assert.equal(local.origins.has('http://127.0.0.1:' + local.port), true);
  assert.equal(local.origins.has('https://custom.example.test'), false);
});
