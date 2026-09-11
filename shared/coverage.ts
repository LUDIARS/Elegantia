import type { Catalog, Criterion } from './catalog.js';
import type { EvaluationContext, TestResult, Verdict } from './results.js';

export type Presence = 'none' | 'current' | 'historical_only';
export interface CriterionCoverage {
  criterion: Criterion;
  presence: Presence;
  latest: TestResult | null;
  historicalCount: number;
}
export interface Overview {
  context: EvaluationContext;
  items: CriterionCoverage[];
  counts: Record<Presence, number> & Record<Verdict, number>;
}
export function sameContext(a: EvaluationContext, b: EvaluationContext): boolean {
  return a.product === b.product && a.build === b.build && a.environment === b.environment;
}
export function newestFirst(a: TestResult, b: TestResult): number {
  return Date.parse(b.testedAt) - Date.parse(a.testedAt) || b.sequence - a.sequence;
}
export function buildOverview(catalog: Catalog, results: TestResult[], context: EvaluationContext): Overview {
  const counts: Overview['counts'] = {
    none: 0, current: 0, historical_only: 0, passed: 0, failed: 0,
    blocked: 0, unverified: 0, not_applicable: 0,
  };
  const byItem = new Map<string, TestResult[]>();
  for (const result of results) {
    if (result.context.product !== context.product) continue;
    const group = byItem.get(result.itemId) ?? [];
    group.push(result);
    byItem.set(result.itemId, group);
  }
  const items = catalog.items.map((criterion): CriterionCoverage => {
    const history = byItem.get(criterion.id) ?? [];
    const current = history.filter(result =>
      sameContext(result.context, context) && result.itemRevision === criterion.revision
      && result.catalogVersion === catalog.version).sort(newestFirst);
    const latest = current[0] ?? null;
    const presence: Presence = latest ? 'current' : history.length ? 'historical_only' : 'none';
    counts[presence]++;
    if (latest) counts[latest.verdict]++;
    return { criterion, presence, latest, historicalCount: history.length - current.length };
  });
  return { context, items, counts };
}
