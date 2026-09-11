import { z } from 'zod';

const identity = z.string().trim().min(1).max(160);
export const contextSchema = z.object({
  product: identity, build: identity, environment: identity,
}).strict();
export type EvaluationContext = z.infer<typeof contextSchema>;
export const verdictSchema = z.enum(['passed', 'failed', 'blocked', 'unverified', 'not_applicable']);
export type Verdict = z.infer<typeof verdictSchema>;
export const verdictLabels: Record<Verdict, string> = {
  passed: '必須達成', failed: '不合格', blocked: '試験中断', unverified: '未確認', not_applicable: '非該当',
};
const evidenceSchema = z.object({
  label: z.string().trim().min(1).max(200),
  url: z.string().url().max(2000).refine(value => {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  }, '証拠は認証情報を含まないHTTP(S) URLで指定してください'),
}).strict();
export const resultInputSchema = z.object({
  requestId: z.string().uuid(),
  context: contextSchema,
  itemId: z.string().regex(/^[CALGE]\d{2}$/),
  itemRevision: z.number().int().positive(),
  catalogVersion: z.string().min(1).max(100),
  verdict: verdictSchema,
  testedAt: z.string().datetime({ offset: true }),
  procedure: z.string().trim().min(1, '試験手順を入力してください').max(12000),
  notes: z.string().trim().max(12000),
  evidence: z.array(evidenceSchema).max(20),
  additionalAchieved: z.boolean(),
}).strict().superRefine((result, ctx) => {
  if (result.verdict === 'passed' && result.evidence.length === 0)
    ctx.addIssue({ code: 'custom', path: ['evidence'], message: '必須達成には証拠URLが必要です' });
  if (result.verdict !== 'passed' && result.additionalAchieved)
    ctx.addIssue({ code: 'custom', path: ['additionalAchieved'], message: '追加達成には必須達成が必要です' });
  if (['not_applicable', 'blocked', 'unverified'].includes(result.verdict) && !result.notes)
    ctx.addIssue({ code: 'custom', path: ['notes'], message: 'この判定には理由を入力してください' });
});
export type ResultInput = z.infer<typeof resultInputSchema>;
export interface TestResult extends ResultInput {
  sequence: number;
  recordedAt: string;
}
export const importSchema = z.object({
  schemaVersion: z.literal(1),
  results: z.array(resultInputSchema).min(1).max(500),
}).strict();
export interface HistoryPage { results: TestResult[]; nextCursor: number | null }
