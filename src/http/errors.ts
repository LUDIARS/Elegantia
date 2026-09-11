import { ZodError } from 'zod';
import { IdempotencyConflict } from '../db/repository.js';
import { ResultValidationError } from '../results/validate.js';

export function clientError(error: unknown): string {
  if (error instanceof ZodError)
    return error.issues.slice(0, 5).map(issue => issue.path.join('.') + ': ' + issue.message).join(' / ');
  if (error instanceof IdempotencyConflict || error instanceof ResultValidationError) return error.message;
  return '処理を完了できませんでした。入力を保持したまま再試行してください。';
}
