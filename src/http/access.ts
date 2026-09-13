import type { IncomingMessage } from 'node:http';
export { matchesHost as allowedHost } from '../runtime/allowed-hosts.js';
import { matchesHost } from '../runtime/allowed-hosts.js';
export function allowedUpgrade(request: IncomingMessage, origins: Set<string>, hosts: Set<string>): boolean {
  return matchesHost(request.headers.host, hosts) && typeof request.headers.origin === 'string'
    && origins.has(request.headers.origin)
    && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress ?? '');
}
