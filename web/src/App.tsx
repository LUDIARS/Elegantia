import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Catalog } from '../../shared/catalog.js';
import type { Overview } from '../../shared/coverage.js';
import { contextSchema, verdictLabels } from '../../shared/results.js';
import { get } from './api.js';
import { ResultForm } from './ResultForm.js';
import { History } from './History.js';
import { ImportResults } from './ImportResults.js';
import { servicePath } from './viewer.js';
import { Policy } from './Policy.js';
const presenceLabels = { none: '記録なし', historical_only: '過去条件のみ', current: '現在の結果あり' };
export function App() {
  const [params, setParams] = useSearchParams();
  const [catalog, setCatalog] = useState<Catalog>();
  const [overview, setOverview] = useState<Overview>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState('');
  const query = params.toString();
  const context = useMemo(() => contextSchema.safeParse(Object.fromEntries(new URLSearchParams(query))), [query]);
  const reload = () => setRefresh(n => n + 1);
  useEffect(() => {
    const controller = new AbortController(); setError('');
    get<Catalog>('/api/catalog', controller.signal).then(setCatalog).catch(err => { if (!controller.signal.aborted) setError((err as Error).message); });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    setOverview(previous => context.success && previous
      && previous.context.product === context.data.product && previous.context.build === context.data.build
      && previous.context.environment === context.data.environment ? previous : undefined);
    if (!context.success) return;
    const controller = new AbortController(); setLoading(true); setError('');
    get<Overview>('/api/overview?' + new URLSearchParams(context.data), controller.signal)
      .then(setOverview).catch(err => { if (!controller.signal.aborted) setError((err as Error).message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [context, refresh]);
  useEffect(() => {
    const onFocus = () => reload(); window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);
  function chooseContext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const parsed = contextSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) { setError('製品・ビルド・環境をすべて入力してください。'); return; }
    setParams(parsed.data); setSelected('');
  }
  const visible = catalog?.items.filter(item => (!category || item.categoryId === category)
    && [item.id, item.title, item.implementation, item.experience, item.requiredCriteria, item.additionalCriteria].join(' ').toLowerCase().includes(search.toLowerCase())
    && (!filter || overview?.items.some(row => row.criterion.id === item.id && (row.presence === filter || row.latest?.verdict === filter)))) ?? [];
  const item = catalog?.items.find(row => row.id === selected);
  return <div className="shell">
    <header><a className="brand" href={servicePath('/')}>ELEGANTIA<span>品質を、証拠で磨く。</span></a><span className="edition">QUALITY OBSERVATORY / 01</span></header>
    <main><section className="intro"><p className="eyebrow">審美眼を、共有できる基準へ。</p><h1>その体験は、<br/><em>エレガントか。</em></h1>
      <p>操作の一瞬から、3DCG作品全体の印象まで。180の観点で品質と試験の証拠を見渡す。</p></section>
      <form className="context" onSubmit={chooseContext} key={query}>
        <label>製品<input name="product" maxLength={160} required defaultValue={params.get('product') ?? ''} placeholder="作品・サービス名" /></label>
        <label>ビルド<input name="build" maxLength={160} required defaultValue={params.get('build') ?? ''} placeholder="バージョン・コミット" /></label>
        <label>環境<input name="environment" maxLength={160} required defaultValue={params.get('environment') ?? ''} placeholder="端末・解像度・設定" /></label>
        <button className="primary">この条件で確認</button>
      </form>
      {!context.success && <p className="notice">まず基準を閲覧できます。試験結果の確認・記録には製品、ビルド、環境を指定してください。</p>}
      {error && <div role="alert" className="notice error">{error} <button onClick={reload}>再取得</button></div>}
      {loading && <p role="status">試験結果を取得中…</p>}
      <section className="stats" aria-label="試験状況">
        {[['基準', catalog?.items.length], ['現在の結果', overview?.counts.current], ['必須達成', overview?.counts.passed],
          ['未達', overview?.counts.failed], ['記録なし', overview?.counts.none], ['過去条件のみ', overview?.counts.historical_only]].map(([label, count]) => <div key={label}><span>{label}</span><strong>{count ?? '—'}</strong></div>)}
      </section>
      <Policy />
      <div className="tools"><label className="search">基準を検索<input value={search} onChange={e => setSearch(e.target.value)} placeholder="入力遅延、照明、カメラ…" /></label>
        <label>結果で絞る<select value={filter} disabled={!overview} onChange={e => setFilter(e.target.value)}><option value="">すべて</option>
          {Object.entries(presenceLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
          {Object.entries(verdictLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
        </select></label><button onClick={reload}>更新</button></div>
      <nav className="categories" aria-label="品質分野"><button aria-pressed={!category} onClick={() => setCategory('')}>すべて · 180</button>
        {catalog?.categories.map(c => <button aria-pressed={category === c.id} key={c.id} onClick={() => setCategory(c.id)}>{c.name} · {c.count}</button>)}</nav>
      <div className="workspace"><section className="catalog" aria-label="品質基準一覧"><p className="muted">{visible.length} 項目</p>
        {visible.map(row => { const coverage = overview?.items.find(c => c.criterion.id === row.id); return <button className={'criterion ' + (selected === row.id ? 'selected' : '')} key={row.id} onClick={() => setSelected(row.id)} aria-expanded={selected === row.id}>
          <span className="item-id">{row.id}</span><span className="item-copy"><strong>{row.title}</strong><span>{row.experience}</span></span>
          <span className={'badge ' + (coverage?.latest?.verdict ?? '')}>{coverage ? coverage.latest ? verdictLabels[coverage.latest.verdict] : presenceLabels[coverage.presence] : '条件未確認'}</span>
        </button>; })}
        {catalog && !visible.length && <p>条件に一致する項目はありません。</p>}
        {!catalog && !error && <p role="status">基準を読み込み中…</p>}
      </section>
      {item && catalog ? <aside className="detail" aria-label={item.id + ' 詳細'}><div className="detail-heading"><span className="item-id">{item.id} / REV. {item.revision}</span><button onClick={() => setSelected('')}>閉じる</button></div><h2>{item.title}</h2>
        <a href={servicePath('/api/items/' + item.id + '/document')} download>この項目のOKF Markdown ↓</a>
        {([['ポイント', item.title], ['実装内容', item.implementation], ['達成しうるUX', item.experience], ['品質達成要件', item.requiredCriteria], ['追加達成要件', item.additionalCriteria]] as const).map(([label, value]) => <section key={label}><h3>{label}</h3><p>{value}</p></section>)}
        {context.success && <><ResultForm key={query + item.id} catalog={catalog} item={item} context={context.data} onSaved={reload} />
          <History key={query + item.id + refresh} product={context.data.product} itemId={item.id} refresh={refresh} /></>}
      </aside> : <aside className="detail empty"><p className="eyebrow">THE STANDARD</p><h2>ひとつの項目から、<br/>体験の質を見直す。</h2><p>項目を選ぶと、実装内容・UX・達成要件と試験履歴を確認できます。</p></aside>}</div>
      <section className="exports"><a href={servicePath('/api/catalog.md')} download>基準をMarkdownで保存 ↓</a><a href={servicePath('/api/catalog')} download="elegantia-catalog.json">基準JSON ↓</a>
        {context.success && <a href={servicePath('/api/results/export?' + new URLSearchParams(context.data))} download>この条件の結果JSON ↓</a>}
        <ImportResults onSaved={reload} /></section>
      <footer>Elegantia · {catalog?.version ?? '…'}<span>結果の存在は品質達成を意味しません。未確認・非該当は達成数に含めません。</span></footer>
    </main></div>;
}
