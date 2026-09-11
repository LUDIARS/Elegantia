import { useState } from 'react';
import { z } from 'zod';
import { resultInputSchema } from '../../shared/results.js';
import { submit } from './api.js';
const fileSchema = z.object({ schemaVersion: z.literal(1), results: z.array(resultInputSchema).min(1) }).strict();
export function ImportResults({ onSaved }: { onSaved: () => void }) {
  const [payload, setPayload] = useState<z.infer<typeof fileSchema> | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function load(file?: File) {
    setPayload(null); setMessage(''); if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setMessage('20 MB以下のJSONを選択してください。'); return; }
    try { setPayload(fileSchema.parse(JSON.parse(await file.text()))); }
    catch { setMessage('試験結果JSONの形式が不正です。エクスポートと同じ形式を指定してください。'); }
  }
  async function save() {
    if (!payload) return; setBusy(true); let confirmed = 0;
    try {
      for (const result of payload.results) {
        await submit('import_results', { schemaVersion: 1, results: [result] }); confirmed++;
        setMessage(confirmed + ' / ' + payload.results.length + ' 件を確認済み');
      }
      setPayload(null); setMessage('取り込みが完了しました。');
    } catch (error) { setMessage(confirmed + ' 件まで確認済み。' + (error as Error).message + ' 同じファイルを再送できます。'); }
    finally { setBusy(false); onSaved(); }
  }
  return <details className="import"><summary>結果JSONを取り込む</summary>
    <input type="file" accept=".json,application/json" disabled={busy} onChange={e => void load(e.target.files?.[0])} aria-label="結果JSON" />
    {payload && <p>{payload.results.length} 件を取り込みます。同一IDは重複しません。</p>}
    {payload && <button disabled={busy} onClick={() => void save()}>{busy ? '取り込み中…' : '取り込みを確定'}</button>}
    <p role="status">{message}</p></details>;
}
