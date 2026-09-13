/** Deployment-owned direct HTTPS origin, separate from additional Viewer origins (Praeforma pattern). */
export function publicOrigin(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && url.origin === value
      && url.hostname.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return value;
  } catch { /* Reject invalid deployment configuration without echoing its value. */ }
  throw new Error('ELEGANTIA_PUBLIC_URL must be an exact HTTPS origin');
}
