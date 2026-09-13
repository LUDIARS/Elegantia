import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase } from '../dist/src/db/connect.js';
import { ResultRepository, IdempotencyConflict } from '../dist/src/db/repository.js';

const migration = fileURLToPath(new URL('../migrations/001_results.sql', import.meta.url));
const context = { product: 'sample', build: '1', environment: 'local' };
const now = () => new Date('2026-09-13T12:00:00Z');
function result(index, changes = {}) {
  return {
    requestId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    context, itemId: 'C01', itemRevision: 1, catalogVersion: 'sample.1',
    verdict: 'failed', testedAt: '2026-09-13T10:00:00Z',
    procedure: 'Observe response', notes: '', evidence: [], additionalAchieved: false,
    ...changes,
  };
}
async function fixture(run) {
  const dir = await mkdtemp(join(tmpdir(), 'elegantia-sqlite-'));
  let database;
  try {
    const filename = join(dir, 'results.sqlite');
    database = await connectDatabase(filename, migration);
    await run(new ResultRepository(database.db, now), async () => {
      await database.close();
      database = undefined;
      database = await connectDatabase(filename, migration);
      return new ResultRepository(database.db, now);
    });
  } finally {
    if (database) await database.close();
    await rm(dir, { recursive: true, force: true });
  }
}
test('persistent reopen, idempotent retry, and atomic conflict rollback', async () => {
  await fixture(async (repository, reopen) => {
    const original = result(2);
    assert.equal(await repository.append([original]), 1);
    assert.equal(await repository.append([original]), 0);
    await assert.rejects(repository.append([result(1), result(2, { notes: 'conflict' })]), IdempotencyConflict);
    repository = await reopen();
    assert.deepEqual(await repository.exportContext(context), [original]);
    assert.deepEqual(await repository.contexts(), [context]);
    assert.equal((await repository.history('sample', 'C01')).results.length, 1);
  });
});
test('latest uses actual UTC time and isolates revisions and evaluation conditions', async () => {
  await fixture(async repository => {
    await repository.append([
      result(1, { testedAt: '2026-09-13T12:00:00+09:00' }),
      result(2, { testedAt: '2026-09-13T04:00:00Z' }),
      result(3, { context: { ...context, build: '2' } }),
      result(4, { itemRevision: 2 }),
      result(5, { catalogVersion: 'sample.2' }),
      result(6, { context: { ...context, environment: 'other' } }),
      result(7, { context: { ...context, product: 'other' } }),
    ]);
    assert.deepEqual((await repository.latestForProduct('sample')).map(row => row.requestId),
      [2, 3, 4, 5, 6].map(index => result(index).requestId));
  });
});
test('history cursor has no duplicate or missing rows and latest breaks ties by sequence', async () => {
  await fixture(async repository => {
    await repository.append(Array.from({ length: 51 }, (_, index) => result(index + 1)));
    const first = await repository.history('sample', 'C01');
    const second = await repository.history('sample', 'C01', first.nextCursor);
    assert.equal(first.results.length, 50);
    assert.equal(second.results.length, 1);
    assert.equal(second.nextCursor, null);
    assert.equal(new Set([...first.results, ...second.results].map(row => row.sequence)).size, 51);
    assert.equal((await repository.latestForProduct('sample'))[0].requestId, result(51).requestId);
  });
});
