import type { DatabaseSync } from 'node:sqlite';
import { contextSchema, resultInputSchema, type EvaluationContext, type HistoryPage, type ResultInput, type TestResult } from '../../shared/results.js';
import type { ResultRow } from './schema.js';
export class IdempotencyConflict extends Error {}
function toResult(row: ResultRow): TestResult {
  return { ...resultInputSchema.parse(JSON.parse(row.payload)), sequence: row.sequence, recordedAt: row.recorded_at };
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object')
    return '{' + Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => JSON.stringify(key) + ':' + canonical(entry)).join(',') + '}';
  return JSON.stringify(value);
}
export class ResultRepository {
  constructor(private readonly db: DatabaseSync, private readonly now: () => Date) {}
  async contexts(): Promise<EvaluationContext[]> {
    const rows = this.db.prepare(`SELECT DISTINCT product,
      json_extract(payload, '$.context.build') AS build,
      json_extract(payload, '$.context.environment') AS environment FROM test_results
      ORDER BY product, build, environment`).all();
    return rows.map(row => contextSchema.parse(row));
  }
  async latestForProduct(product: string): Promise<TestResult[]> {
    const rows = this.db.prepare(`SELECT sequence, recorded_at, payload FROM (
      SELECT sequence, recorded_at, payload, ROW_NUMBER() OVER (
        PARTITION BY item_id, json_extract(payload, '$.context.build'),
          json_extract(payload, '$.context.environment'), json_extract(payload, '$.itemRevision'),
          json_extract(payload, '$.catalogVersion') ORDER BY tested_at DESC, sequence DESC
      ) AS position FROM test_results WHERE product = ?
    ) WHERE position = 1 ORDER BY sequence`).all(product) as unknown as ResultRow[];
    return rows.map(toResult);
  }
  async history(product: string, itemId: string, cursor?: number): Promise<HistoryPage> {
    const rows = this.db.prepare(`SELECT sequence, recorded_at, payload FROM test_results
      WHERE product = ? AND item_id = ? ${cursor === undefined ? '' : 'AND sequence < ?'}
      ORDER BY sequence DESC LIMIT 51`).all(...(cursor === undefined ? [product, itemId] : [product, itemId, cursor])) as unknown as ResultRow[];
    return { results: rows.slice(0, 50).map(toResult), nextCursor: rows.length > 50 ? rows[49].sequence : null };
  }
  async exportContext(context: EvaluationContext): Promise<ResultInput[]> {
    const rows = this.db.prepare(`SELECT payload FROM test_results WHERE product = ?
      AND json_extract(payload, '$.context.build') = ? AND json_extract(payload, '$.context.environment') = ?
      ORDER BY sequence`).all(context.product, context.build, context.environment) as unknown as Pick<ResultRow, 'payload'>[];
    return rows.map(row => resultInputSchema.parse(JSON.parse(row.payload)));
  }
  async append(results: ResultInput[]): Promise<number> {
    // No await inside the transaction: requests cannot share this connection's transaction.
    this.db.exec('BEGIN IMMEDIATE');
    try {
      let created = 0;
      const find = this.db.prepare('SELECT payload FROM test_results WHERE request_id = ?');
      const insert = this.db.prepare(`INSERT INTO test_results
        (request_id, product, item_id, tested_at, recorded_at, payload) VALUES (?, ?, ?, ?, ?, ?)`);
      for (const raw of [...results].sort((a, b) => a.requestId.localeCompare(b.requestId))) {
        const result = resultInputSchema.parse(raw);
        const existing = find.get(result.requestId) as { payload: string } | undefined;
        if (existing) {
          if (canonical(JSON.parse(existing.payload)) !== canonical(result))
            throw new IdempotencyConflict('同じ送信IDに異なる結果が登録されています');
          continue;
        }
        insert.run(result.requestId, result.context.product, result.itemId,
          new Date(result.testedAt).toISOString(), this.now().toISOString(), JSON.stringify(result));
        created++;
      }
      this.db.exec('COMMIT');
      return created;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
}