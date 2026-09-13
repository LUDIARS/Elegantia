import type { DatabaseSync } from 'node:sqlite';
import { humanReviewSchema, type HumanReview, type HumanReviewInput } from '../../shared/local.js';
import { IdempotencyConflict } from './repository.js';
export class HumanReviews {
  constructor(private readonly db: DatabaseSync, private readonly now: () => Date) {}
  history(project: string, itemId: string, cursor?: number): HumanReview[] {
    return this.db.prepare(`SELECT sequence, request_id AS requestId, project, item_id AS itemId,
      verdict, comment, recorded_at AS recordedAt FROM human_reviews WHERE project = ? AND item_id = ?
      ${cursor === undefined ? '' : 'AND sequence < ?'} ORDER BY sequence DESC LIMIT 50`)
      .all(...(cursor === undefined ? [project, itemId] : [project, itemId, cursor])) as unknown as HumanReview[];
  }
  append(raw: HumanReviewInput): void {
    const value = humanReviewSchema.parse(raw);
    const existing = this.db.prepare('SELECT project, item_id, verdict, comment FROM human_reviews WHERE request_id = ?').get(value.requestId);
    if (existing) {
      if (existing.project !== value.project || existing.item_id !== value.itemId || existing.verdict !== value.verdict || existing.comment !== value.comment)
        throw new IdempotencyConflict('Human review request ID conflicts');
      return;
    }
    this.db.prepare('INSERT INTO human_reviews(request_id, project, item_id, verdict, comment, recorded_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(value.requestId, value.project, value.itemId, value.verdict, value.comment, this.now().toISOString());
  }
  updates(): Map<string, number> {
    const rows = this.db.prepare(`SELECT project, MAX(recorded_at) AS updated FROM (
      SELECT project, recorded_at FROM human_reviews UNION ALL SELECT product AS project, recorded_at FROM test_results
    ) GROUP BY project`).all();
    return new Map(rows.map(row => [String(row.project), Date.parse(String(row.updated))]));
  }
}
