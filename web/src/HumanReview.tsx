import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { HumanReview as Review } from '../../shared/local.js';
import { get } from './api.js';
import { servicePath } from './viewer.js';
export function HumanReview({ project, itemId, onSaved }: { project: string; itemId: string; onSaved: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<'OK' | 'NG'>('NG');
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const retry = useRef<{ body: string; requestId: string } | undefined>(undefined);
  useEffect(() => {
    const controller = new AbortController();
    get<{ reviews: Review[]; nextCursor: number | null }>('/api/local/reviews?' + new URLSearchParams({ project, itemId }), controller.signal)
      .then(page => { setReviews(page.reviews); setCursor(page.nextCursor); if (page.reviews[0]) setVerdict(page.reviews[0].verdict); })
      .catch(e => { if (!controller.signal.aborted) setMessage((e as Error).message); });
    return () => controller.abort();
  }, [project, itemId, revision]);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    const value = { project, itemId, verdict, comment: comment.trim() }; const body = JSON.stringify(value);
    if (retry.current?.body !== body) retry.current = { body, requestId: crypto.randomUUID() };
    try {
      const response = await fetch(servicePath('/api/local/reviews'), { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...value, requestId: retry.current.requestId }), signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('保存できませんでした。登録と接続を確認してください。');
      setComment(''); setRevision(n => n + 1); onSaved(); setMessage('申し送りを保存しました。');
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  async function more() {
    if (cursor === null) return; setBusy(true);
    try { const page = await get<{ reviews: Review[]; nextCursor: number | null }>('/api/local/reviews?' + new URLSearchParams({ project, itemId, cursor: String(cursor) }));
      setReviews(values => [...values, ...page.reviews]); setCursor(page.nextCursor);
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  return <section><h3>人間の申し送り</h3><p>最新: {reviews[0]?.verdict ?? '未記録'}。試験の合否とは別に記録します。</p>
    <form onSubmit={save}><label>判断<select value={verdict} onChange={e => setVerdict(e.target.value as 'OK' | 'NG')}><option>OK</option><option>NG</option></select></label>
      <label>人間のコメント<textarea required maxLength={12000} value={comment} onChange={e => setComment(e.target.value)} /></label>
      <button disabled={busy}>{busy ? '保存中…' : '判断とコメントを保存'}</button></form><p role="status">{message}</p>
    {reviews.map(review => <article key={review.sequence}><strong>{review.verdict}</strong> <time>{new Date(review.recordedAt).toLocaleString()}</time><p>{review.comment}</p></article>)}
    {cursor !== null && <button disabled={busy} onClick={() => void more()}>以前の申し送り</button>}
  </section>;
}
