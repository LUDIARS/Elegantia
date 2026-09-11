import type { Catalog } from '../../shared/catalog.js';
import { resultInputSchema, type ResultInput } from '../../shared/results.js';

export class ResultValidationError extends Error {}
export function validateResult(value: unknown, catalog: Catalog, now: Date, historical = false): ResultInput {
  const result = resultInputSchema.parse(value);
  const item = catalog.items.find(entry => entry.id === result.itemId);
  if (!item) throw new ResultValidationError('カタログに存在しない項目です');
  if (!historical && (item.revision !== result.itemRevision || catalog.version !== result.catalogVersion))
    throw new ResultValidationError('要件の版が異なります。現在のカタログで再確認してください');
  if (Date.parse(result.testedAt) > now.getTime())
    throw new ResultValidationError('実施日時に未来の時刻は指定できません');
  return { ...result, testedAt: new Date(result.testedAt).toISOString() };
}
