import { z } from 'zod';
export const librarySchema = z.object({
  schemaVersion: z.literal(1),
  entries: z.array(z.object({
    id: z.string().regex(/^template-\d+$/), kind: z.enum(['advisory', 'quality', 'ux']),
    title: z.string().min(1), summary: z.string().min(1),
    path: z.string().regex(/^(advisory|quality\/templates|ux)\/.+\.md$/).refine(value => !value.includes('..') && !/[\\\x00-\x1f]/.test(value)),
    qualityIds: z.array(z.string().regex(/^[CDAPLGE]\d{2}$/)),
    ludusReferences: z.array(z.object({
      repository: z.literal('LUDIARS/Ludus'), revision: z.string().regex(/^[a-f0-9]{40}$/),
      path: z.string().regex(/^spec\/data\/game-template\/[a-z0-9_/-]+\.md$/).refine(value => !value.includes('..')),
      genre: z.string().min(1), featureIds: z.array(z.string().regex(/^[a-z0-9-]+$/)),
    }).strict()), markdown: z.string().min(1),
  }).strict()),
}).strict();
export type Library = z.infer<typeof librarySchema>;
