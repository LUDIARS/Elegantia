import { useEffect, useState } from 'react';
import type { LocalProject } from '../../shared/local.js';
import type { EvaluationContext } from '../../shared/results.js';
import { get } from './api.js';
interface Page { projects: LocalProject[]; nextOffset: number | null }
export function LocalProjects({ project, onProject, onContext, refresh }: {
  project: string; onProject: (project: string) => void; onContext: (context: EvaluationContext) => void; refresh: number;
}) {
  const [page, setPage] = useState<Page>();
  const [contexts, setContexts] = useState<EvaluationContext[]>([]);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setError(''); setPage(undefined);
    Promise.all([get<Page>('/api/local/projects?offset=' + offset, controller.signal),
      get<{ contexts: EvaluationContext[] }>('/api/contexts', controller.signal)])
      .then(([projects, values]) => { setPage(projects); setContexts(values.contexts); })
      .catch(e => { if (!controller.signal.aborted) setError((e as Error).message); });
    return () => controller.abort();
  }, [offset, refresh]);
  const choices = contexts.filter(context => context.product === project);
  return <section className="local-projects" aria-label="登録済みプロジェクト">
    <h2>登録済みプロジェクト</h2><p>更新が新しい順に10件ずつ表示します。</p>
    {error && <p role="alert">{error}</p>}
    {!page && !error && <p role="status">プロジェクトを取得中…</p>}
    <div className="project-grid">{page?.projects.map(entry => <button key={entry.code} aria-pressed={project === entry.project}
      onClick={() => onProject(entry.project)}><strong>{entry.project}</strong><span>{entry.code} · {new Date(entry.updatedAt).toLocaleString()}</span></button>)}</div>
    {page && !page.projects.length && <p>登録済みプロジェクトはありません。</p>}
    <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 10))}>前の10件</button>
    <button disabled={page?.nextOffset == null} onClick={() => { if (page?.nextOffset != null) setOffset(page.nextOffset); }}>次の10件</button>
    {project && <div><h3>{project}の評価</h3>{choices.length ? <label>保存済みの評価条件<select defaultValue="" key={project}
      onChange={event => { const choice = choices[Number(event.target.value)]; if (choice) onContext(choice); }}>
      <option value="" disabled>ビルド・環境を選択</option>{choices.map((context, index) => <option key={index} value={index}>{context.build} / {context.environment}</option>)}
    </select></label> : <p>保存済み評価はありません。項目を選んで人間の申し送りを残せます。</p>}</div>}
  </section>;
}
