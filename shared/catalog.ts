import { z } from 'zod';

export const categorySchema = z.enum(['C', 'A', 'L', 'G', 'E']);
export const criterionSchema = z.object({
  id: z.string().regex(/^[CALGE]\d{2}$/),
  categoryId: categorySchema,
  revision: z.number().int().positive(),
  title: z.string().min(1),
  documentPath: z.string().regex(/^quality\/items\/[CALGE]-[^/\\\x00-\x1f]+\/[CALGE]\d{2}-[^/\\\x00-\x1f]+\.md$/),
  implementation: z.string().min(1),
  experience: z.string().min(1),
  requiredCriteria: z.string().min(1),
  additionalCriteria: z.string().min(1),
}).strict();
export const catalogSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string(),
  description: z.string(),
  categories: z.array(z.object({ id: categorySchema, name: z.string(), count: z.number().int().positive() }).strict()),
  items: z.array(criterionSchema).min(1),
}).strict().superRefine((catalog, ctx) => {
  if (new Set(catalog.items.map(item => item.id)).size !== catalog.items.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate criterion IDs' });
  if (new Set(catalog.categories.map(category => category.id)).size !== catalog.categories.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate categories' });
  for (const category of catalog.categories) {
    if (catalog.items.filter(item => item.categoryId === category.id).length !== category.count)
      ctx.addIssue({ code: 'custom', message: 'Category count mismatch: ' + category.id });
  }
  for (const item of catalog.items) {
    if (item.id[0] !== item.categoryId || !catalog.categories.some(category => category.id === item.categoryId))
      ctx.addIssue({ code: 'custom', message: 'Invalid category: ' + item.id });
  }
});
export type Criterion = z.infer<typeof criterionSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
