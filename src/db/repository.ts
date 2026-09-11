import { and, desc, eq, lt, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { resultInputSchema, type EvaluationContext, type HistoryPage, type ResultInput, type TestResult } from '../../shared/results.js';
import * as schema from './schema.js';

export class IdempotencyConflict extends Error {}
type ResultRow = typeof schema.testResults.$inferSelect;
function toResult(row: ResultRow): TestResult {
  return { ...resultInputSchema.parse(row.payload), sequence: row.sequence,
    recordedAt: new Date(row.recordedAt).toISOString() };
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object')
    return '{' + Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => JSON.stringify(key) + ':' + canonical(entry)).join(',') + '}';
  return JSON.stringify(value);
}
export class ResultRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>, private readonly now: () => Date) {}

  async contexts(): Promise<EvaluationContext[]> {
    const rows = await this.db.selectDistinct({
      context: sql<EvaluationContext>`payload->'context'`,
    }).from(schema.testResults);
    return rows.map(row => row.context);
  }

  async latestForProduct(product: string): Promise<TestResult[]> {
    const table = schema.testResults;
    const build = sql<string>`payload->'context'->>'build'`;
    const environment = sql<string>`payload->'context'->>'environment'`;
    const revision = sql<string>`payload->>'itemRevision'`;
    const catalog = sql<string>`payload->>'catalogVersion'`;
    const rows = await this.db.selectDistinctOn([table.itemId, build, environment, revision, catalog])
      .from(table).where(eq(table.product, product))
      .orderBy(table.itemId, build, environment, revision, catalog, desc(table.testedAt), desc(table.sequence));
    return rows.map(toResult);
  }

  async history(product: string, itemId: string, cursor?: number): Promise<HistoryPage> {
    const table = schema.testResults;
    const where = and(eq(table.product, product), eq(table.itemId, itemId), cursor ? lt(table.sequence, cursor) : undefined);
    const rows = await this.db.select().from(table).where(where).orderBy(desc(table.sequence)).limit(51);
    return { results: rows.slice(0, 50).map(toResult), nextCursor: rows.length > 50 ? rows[49].sequence : null };
  }

  async exportContext(context: EvaluationContext): Promise<ResultInput[]> {
    const rows = await this.db.select().from(schema.testResults).where(and(
      eq(schema.testResults.product, context.product),
      sql`payload->'context'->>'build' = ${context.build}`,
      sql`payload->'context'->>'environment' = ${context.environment}`,
    )).orderBy(schema.testResults.sequence);
    return rows.map(row => resultInputSchema.parse(row.payload));
  }

  async append(results: ResultInput[]): Promise<number> {
    return this.db.transaction(async tx => {
      let created = 0;
      // Serialize short append transactions, including retries and overlapping imports.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('elegantia-results-append'))`);
      const ordered = [...results].sort((a, b) => a.requestId.localeCompare(b.requestId));
      for (const result of ordered) {
        const [existing] = await tx.select().from(schema.testResults).where(eq(schema.testResults.requestId, result.requestId));
        if (existing) {
          if (canonical(existing.payload) !== canonical(result))
            throw new IdempotencyConflict('同じ送信IDに異なる結果が登録されています');
          continue;
        }
        await tx.insert(schema.testResults).values({
          requestId: result.requestId, product: result.context.product, itemId: result.itemId,
          testedAt: result.testedAt, recordedAt: this.now().toISOString(), payload: result,
        });
        created++;
      }
      return created;
    });
  }
}
