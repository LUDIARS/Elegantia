/** Excubitor/Vite convention: a leading dot allows the domain and its subdomains. */
export function injectedHosts(value: string | undefined): string[] {
  return (value ?? '').split(',').map(entry => entry.trim().toLowerCase()).filter(Boolean).map(entry => {
    const hostname = entry.startsWith('.') ? entry.slice(1) : entry;
    if (hostname.length > 253 || !hostname.split('.').every(label =>
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))
      throw new Error('Invalid LUDIARS_ALLOWED_HOSTS hostname');
    return entry;
  });
}

export function matchesHost(host: string | undefined, allowed: Set<string>): boolean {
  if (!host || /[\s,/@\\?#%]/.test(host)) return false;
  let url: URL;
  try { url = new URL('http://' + host); } catch { return false; }
  const authority = host.toLowerCase();
  return [...allowed].some(entry => entry.startsWith('.')
    ? url.hostname === entry.slice(1) || url.hostname.endsWith(entry)
    : authority === entry || (!entry.includes(':') && url.hostname === entry));
}
