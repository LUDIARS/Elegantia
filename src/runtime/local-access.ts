export function isLocalAccess(mode: 'public' | 'local', port: number, host: string | undefined, origin?: string): boolean {
  if (mode !== 'local') return false;
  const hosts = new Set(['127.0.0.1:' + port, 'localhost:' + port]);
  return !!host && hosts.has(host.toLowerCase()) && (!origin || [...hosts].some(value => origin === 'http://' + value));
}
