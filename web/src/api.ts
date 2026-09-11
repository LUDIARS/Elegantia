import { servicePath } from './viewer.js';
export async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(servicePath(url), { signal });
  if (!response.ok) throw new Error('取得できませんでした。接続と入力を確認して再試行してください。');
  return response.json() as Promise<T>;
}
export function submit(action: 'record_result' | 'import_results', payload: unknown): Promise<number> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(location.origin.replace(/^http/, 'ws') + servicePath('/ws'));
    const requestId = crypto.randomUUID();
    let done = false;
    const finish = (error?: string, count = 0): void => {
      if (done) return; done = true; clearTimeout(timer); socket.close();
      if (error) reject(new Error(error)); else resolve(count);
    };
    const timer = setTimeout(() => finish('保存結果を確認できません。履歴を確認してから再送してください。同じIDは重複保存されません。'), 15000);
    socket.onopen = () => socket.send(JSON.stringify({ type: 'module_request', requestId, action, payload }));
    socket.onerror = () => finish('保存接続に失敗しました。再送できます。');
    socket.onclose = () => { if (!done) finish('接続が切れました。履歴を確認して再送してください。'); };
    socket.onmessage = event => {
      try {
        const reply = JSON.parse(String(event.data)) as { requestId?: string; ok?: boolean; error?: string; count?: number };
        if (reply.requestId === requestId) finish(reply.ok ? undefined : reply.error ?? '保存できませんでした。', reply.count);
      } catch { finish('応答を読み取れませんでした。'); }
    };
  });
}
