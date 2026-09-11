import { useEffect, useState } from 'react';
import type { HistoryPage, TestResult } from '../../shared/results.js';
import { verdictLabels } from '../../shared/results.js';
import { get } from './api.js';
export function History({ product, itemId, refresh }: { product: string; itemId: string; refresh: number }) {
  const [rows, setRows] = useState<TestResult[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState<number | undefined>();
  useEffect(() => {
    const controller = new AbortController(); setError(''); setBusy(true);
    get<HistoryPage>('/api/items/' + itemId + '/results?product=' + encodeURIComponent(product) + (page ? '&cursor=' + page : ''), controller.signal)
      .then(data => { setRows(old => page ? [...old, ...data.results] : data.results); setCursor(data.nextCursor); })
      .catch(err => { if (!controller.signal.aborted) setError((err as Error).message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [product, itemId, refresh, page]);
  return <section><h3>製品の試験履歴</h3><p className="muted">他ビルド・環境・旧基準も含む、新しい記録順。</p>
    {error && <p role="alert">{error}</p>}{busy && <p role="status">履歴を取得中…</p>}
    {!busy && !error && !rows.length && <p>保存された結果はありません。</p>}
    {rows.map(row => <article className="history" key={row.requestId}>
      <strong>{verdictLabels[row.verdict]}</strong><p>{row.context.build} / {row.context.environment}</p>
      <p className="muted">試験 {new Date(row.testedAt).toLocaleString()} · 基準 {row.catalogVersion} / rev.{row.itemRevision}</p>
      <p>{row.procedure}</p><p>{row.notes}</p>
      {row.evidence.map((e, i) => <a key={i} href={e.url} target="_blank" rel="noreferrer">{e.label} ↗ </a>)}
      {row.additionalAchieved && <p>追加達成あり</p>}
    </article>)}
    {cursor !== null && <button disabled={busy} onClick={() => setPage(cursor)}>過去の記録を表示</button>}
  </section>;
}
