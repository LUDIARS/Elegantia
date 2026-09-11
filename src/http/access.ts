import type { IncomingMessage } from 'node:http';
export function allowedHost(host: string | undefined, origins: Set<string>): boolean {
  return !!host && origins.has('http://' + host);
}
export function allowedUpgrade(request: IncomingMessage, origins: Set<string>): boolean {
  return allowedHost(request.headers.host, origins) && typeof request.headers.origin === 'string'
    && origins.has(request.headers.origin)
    && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress ?? '');
}
