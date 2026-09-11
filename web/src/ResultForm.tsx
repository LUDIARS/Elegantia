import { useRef, useState, type FormEvent } from 'react';
import type { Catalog, Criterion } from '../../shared/catalog.js';
import { resultInputSchema, verdictLabels, type EvaluationContext, type Verdict } from '../../shared/results.js';
import { submit } from './api.js';
export function ResultForm({ catalog, item, context, onSaved }: { catalog: Catalog; item: Criterion; context: EvaluationContext; onSaved: () => void }) {
  const [verdict, setVerdict] = useState<Verdict>('unverified');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const retry = useRef<{ fingerprint: string; requestId: string } | null>(null);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = new Date(String(form.get('testedAt')));
    if (!Number.isFinite(date.getTime())) { setMessage('試験日時を指定してください。'); return; }
    const evidence = String(form.get('evidence')).split('\n').map(line => line.trim()).filter(Boolean).map(url => ({ label: '試験証拠', url }));
    const value = { context, itemId: item.id, itemRevision: item.revision, catalogVersion: catalog.version, verdict,
      testedAt: date.toISOString(), procedure: form.get('procedure'), notes: form.get('notes'), evidence,
      additionalAchieved: verdict === 'passed' && form.get('additional') === 'on' };
    const fingerprint = JSON.stringify(value);
    if (retry.current?.fingerprint !== fingerprint) retry.current = { fingerprint, requestId: crypto.randomUUID() };
    const parsed = resultInputSchema.safeParse({ ...value, requestId: retry.current.requestId });
    if (!parsed.success) { setMessage(parsed.error.issues.map(issue => issue.message).join(' / ')); return; }
    setBusy(true); setMessage('');
    try { await submit('record_result', parsed.data); setMessage('結果を保存しました。'); onSaved(); }
    catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  return <form className="result-form" onSubmit={save}>
    <h3>試験結果を記録</h3><p className="muted">選択中の製品・ビルド・環境に実測結果を保存します。</p>
    <label>判定<select value={verdict} onChange={e => setVerdict(e.target.value as Verdict)}>{Object.entries(verdictLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <label>試験日時（端末のタイムゾーン）<input name="testedAt" type="datetime-local" required /></label>
    <label>試験手順・観測内容<textarea name="procedure" required maxLength={12000} rows={3} /></label>
    <label>補足・未確認／阻害／非該当の理由<textarea name="notes" maxLength={12000} rows={2} /></label>
    <label>証拠URL（1行に1件、必須達成には必須）<textarea name="evidence" rows={2} placeholder="https://…" /></label>
    <label className="check"><input type="checkbox" name="additional" disabled={verdict !== 'passed'} />追加達成要件も達成した</label>
    <button className="primary" disabled={busy}>{busy ? '保存中…' : '結果を保存'}</button><p role="status">{message}</p>
  </form>;
}
