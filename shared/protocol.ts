import { z } from 'zod';
import { importSchema, resultInputSchema } from './results.js';

export const moduleRequestSchema = z.object({
  type: z.literal('module_request'),
  requestId: z.string().uuid(),
  action: z.enum(['record_result', 'import_results']),
  payload: z.unknown(),
}).strict();
export const payloadSchemas = { record_result: resultInputSchema, import_results: importSchema };
export interface ModuleReply {
  type: 'module_response';
  requestId: string;
  ok: boolean;
  count?: number;
  error?: string;
}
export interface Invalidation { type: 'results_changed'; product: string }
