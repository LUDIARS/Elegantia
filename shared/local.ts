import { z } from 'zod';
export const humanReviewSchema = z.object({
  requestId: z.string().uuid(), project: z.string().trim().min(1).max(160),
  itemId: z.string().regex(/^[CDAPLGE]\d{2}$/), verdict: z.enum(['OK', 'NG']),
  comment: z.string().trim().min(1).max(12000),
}).strict();
export type HumanReviewInput = z.infer<typeof humanReviewSchema>;
export interface HumanReview extends HumanReviewInput { sequence: number; recordedAt: string }
export interface LocalProject { code: string; project: string; updatedAt: number }

export type AccessLevel = 'local' | 'viewer' | 'public';
