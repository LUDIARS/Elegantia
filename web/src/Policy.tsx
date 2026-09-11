import { useState } from 'react';
import { get } from './api.js';
import './policy.css';
export function Policy() {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  async function load() {
    if (text) return;
    try { const value = await get<{ markdown: string }>('/api/policy'); setText(value.markdown.replace(/^---[\s\S]*?---\s*/, '')); }
    catch { setError('共通評価条件を取得できませんでした。'); }
  }
  return <details className="policy" onToggle={event => { if (event.currentTarget.open) void load(); }}>
    <summary className="policy-toggle">共通の評価条件・記号（U / I / Fなど）と品質の姿勢</summary>
    {error && <p role="alert">{error} <button onClick={() => void load()}>再取得</button></p>}
    {!text && !error && <p>読み込み中…</p>}
    {text && <div className="policy-text">{text.split('\n').map((line, index) => /^#{1,3} /.test(line)
      ? <h3 key={index}>{line.replace(/^#+ /, '')}</h3> : <p key={index}>{line}</p>)}</div>}
  </details>;
}
