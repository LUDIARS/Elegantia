import type { Server } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import type { Writer } from '@ludiars/vestigium';
import type { Catalog } from '../../shared/catalog.js';
import { importSchema } from '../../shared/results.js';
import { moduleRequestSchema, type ModuleReply } from '../../shared/protocol.js';
import { ResultRepository } from '../db/repository.js';
import { validateResult } from '../results/validate.js';
import { allowedUpgrade } from './access.js';
import { clientError } from './errors.js';

export interface SocketDependencies {
  server: Server; origins: Set<string>; maxPayloadBytes: number; maxImportRecords: number;
  repository: ResultRepository; catalog: Catalog; logger: Writer; now: () => Date;
}
export function attachSocket(deps: SocketDependencies): { close(): Promise<void> } {
  const wss = new WebSocketServer({ noServer: true, maxPayload: deps.maxPayloadBytes, perMessageDeflate: false });
  const pending = new Set<Promise<void>>();
  const onUpgrade = (request: import('node:http').IncomingMessage, socket: import('node:stream').Duplex, head: Buffer): void => {
    if (request.url !== '/ws' || !allowedUpgrade(request, deps.origins)) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, client => wss.emit('connection', client, request));
  };
  deps.server.on('upgrade', onUpgrade);
  wss.on('connection', socket => {
    let busy = false;
    socket.on('error', () => deps.logger.write({ level: 'warn', msg: 'WebSocket connection failed' }));
    socket.on('message', raw => {
      const task = handleMessage(raw.toString('utf8')).catch(() => {
        deps.logger.write({ level: 'warn', msg: 'Result reply could not be delivered' });
      }).finally(() => pending.delete(task));
      pending.add(task);
    });
    async function handleMessage(text: string): Promise<void> {
      let requestId = '';
      let acquired = false;
      try {
        const request = moduleRequestSchema.parse(JSON.parse(text));
        requestId = request.requestId;
        if (busy) { reply({ type: 'module_response', requestId, ok: false, error: '保存中です。完了後に再送してください。' }); return; }
        busy = true; acquired = true;
        const values = request.action === 'record_result'
          ? [request.payload] : importSchema.parse(request.payload).results;
        if (values.length > deps.maxImportRecords) throw new Error('Import limit exceeded');
        const results = values.map(value => validateResult(value, deps.catalog, deps.now(), request.action === 'import_results'));
        const count = await deps.repository.append(results);
        reply({ type: 'module_response', requestId, ok: true, count });
        for (const product of new Set(results.map(result => result.context.product))) {
          const message = JSON.stringify({ type: 'results_changed', product });
          for (const client of wss.clients) if (client.readyState === WebSocket.OPEN) client.send(message);
        }
      } catch (error) {
        deps.logger.write({ level: 'warn', msg: 'Result submission rejected', ctx: { name: error instanceof Error ? error.name : 'unknown' } });
        reply({ type: 'module_response', requestId, ok: false, error: clientError(error) });
      } finally { if (acquired) busy = false; }
    }
    function reply(message: ModuleReply): void {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    }
  });
  return {
    async close(): Promise<void> {
      deps.server.off('upgrade', onUpgrade);
      for (const client of wss.clients) client.terminate();
      await new Promise<void>(resolve => wss.close(() => resolve()));
      await Promise.allSettled(pending);
    },
  };
}
