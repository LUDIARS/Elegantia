import { useEffect, useState } from 'react';
import type { Library as LibraryData } from '../../shared/library.js';
import { get } from './api.js';
import { servicePath } from './viewer.js';
import './library.css';
const labels = { advisory: 'アドバイザリー', quality: 'クォリティ', ux: 'UXテンプレート' };
export function Library() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<LibraryData | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  useEffect(() => {
    if (!open || data) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let active = true;
    setError('');
    void get<LibraryData>('/api/library', controller.signal).then(value => { if (active) setData(value); })
      .catch(() => { if (active) setError('テンプレートを取得できませんでした。再取得できます。'); })
      .finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [open, data, retry]);
  const words = search.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const visible = data?.entries.filter(entry => (!kind || entry.kind === kind)
    && words.every(word => [entry.title, entry.summary, entry.markdown, ...entry.qualityIds,
      ...entry.ludusReferences.flatMap(ref => ref.featureIds)].join(' ').toLocaleLowerCase().includes(word))) ?? [];
  return <details className="library" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>設計と体験のテンプレート</summary>
    <p>アドバイザリーは任意の設計指針。クォリティは確かめる基準。UXは目指す体験から機能と品質へ逆引きします。</p>
    <div className="tools"><label>テンプレートを検索<input value={search} onChange={e => setSearch(e.target.value)} placeholder="体験、設計の悩み、品質ID、Ludus機能ID…" /></label>
      <label>種類<select value={kind} onChange={e => setKind(e.target.value)}><option value="">すべて</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
    {!data && !error && open && <p role="status">テンプレートを取得中…</p>}
    {error && <p role="alert">{error} <button onClick={() => setRetry(value => value + 1)}>再取得</button></p>}
    {data && <p>{visible.length} 件</p>}
    {visible.map(entry => <details className="library-entry" key={entry.id}><summary>{labels[entry.kind]} · {entry.title}</summary>
      <p>{entry.summary}</p><a href={servicePath('/api/library/' + entry.id + '/document')} download>Markdownを保存 ↓</a>
      {entry.qualityIds.length > 0 && <p>対応する品質項目：{entry.qualityIds.join(' / ')}</p>}
      {entry.ludusReferences.map(ref => <p key={ref.path}><a href={'https://github.com/' + ref.repository + '/blob/' + ref.revision + '/' + ref.path} target="_blank" rel="noreferrer">Ludusの正本を開く</a> · {ref.featureIds.join(' / ')}</p>)}
      <div className="library-text">{entry.markdown.replace(/^---[\s\S]*?---\s*/, '').split('\n').map((line, i) => /^#{1,3} /.test(line)
        ? <h3 key={i}>{line.replace(/^#+ /, '')}</h3> : <p key={i}>{line || '\u00a0'}</p>)}</div>
    </details>)}
  </details>;
}
