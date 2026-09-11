import { bigserial, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { ResultInput } from '../../shared/results.js';

export const testResults = pgTable('test_results', {
  sequence: bigserial('sequence', { mode: 'number' }).primaryKey(),
  requestId: uuid('request_id').notNull(),
  product: text('product').notNull(),
  itemId: text('item_id').notNull(),
  testedAt: timestamp('tested_at', { withTimezone: true, mode: 'string' }).notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true, mode: 'string' }).notNull(),
  payload: jsonb('payload').$type<ResultInput>().notNull(),
}, table => [
  uniqueIndex('test_results_request_id_idx').on(table.requestId),
  index('test_results_product_item_idx').on(table.product, table.itemId, table.sequence),
]);
