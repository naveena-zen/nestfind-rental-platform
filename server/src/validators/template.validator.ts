import { z } from 'zod';

export const ClauseTypeEnum = z.enum([
  'DEPOSIT',
  'LATE_FEE',
  'CANCELLATION_WINDOW',
  'DAMAGE_LIABILITY',
  'REQUIRES_ARBITRATION',
]);

export const ClauseSchema = z.object({
  type: ClauseTypeEnum,
  title: z.string().min(1),
  params: z.record(z.any()),
  description: z.string().optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(2, 'Template name must be at least 2 characters'),
  clauses: z.array(ClauseSchema).min(1, 'At least one clause is required'),
});

export const updateTemplateSchema = createTemplateSchema.partial();
