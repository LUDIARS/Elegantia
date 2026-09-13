import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {loadConfig} from '../dist/src/runtime/config.js';
import {loadCatalog} from '../dist/src/catalog/load.js';
import {createApp} from '../dist/src/http/app.js';
import {isLocalAccess} from '../dist/src/runtime/local-access.js';

test('public HTTP cannot read evaluations or human reviews, even with evaluation query parameters', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const config = await loadConfig(root, { ELEGANTIA_PUBLIC_URL: 'https://el.example.test' });
  const catalog = await loadCatalog(root + '/data/catalog.json');
  const app = createApp({config, catalog, repository: {}, reviews: {}, logger: { write() {} }, ping: async () => {}});
  for (const path of ['/api/contexts', '/api/overview?product=private&build=1&environment=local',
    '/api/results/export?product=private', '/api/items/C01/results?product=private', '/api/local/projects', '/api/local/reviews']) {
    const response = await app.request('http://localhost:' + config.port + path, {headers:{host:'localhost:' + config.port}});
    assert.equal(response.status, 403, path);
  }
  const write = await app.request('http://localhost:' + config.port + '/api/local/reviews', {method:'POST', headers:{host:'localhost:' + config.port}});
  assert.equal(write.status, 403);
  const publicCatalog = await app.request('https://el.example.test/api/catalog', {headers:{host:'el.example.test'}});
  assert.equal(publicCatalog.status, 200);
});

test('local mode requires local Host and local Origin; a public Tunnel stays public', () => {
  assert.equal(isLocalAccess('local',17860,'localhost:17860','http://localhost:17860'),true);
  assert.equal(isLocalAccess('local',17860,'el.example.test','https://el.example.test'),false);
  assert.equal(isLocalAccess('local',17860,'localhost:17860','https://el.example.test'),false);
  assert.equal(isLocalAccess('public',17860,'localhost:17860'),false);
  assert.equal(isLocalAccess('local',17860,'localhost:17860.evil.test'),false);
});
