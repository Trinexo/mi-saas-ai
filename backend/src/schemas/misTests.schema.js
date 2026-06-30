import { z } from 'zod';

export const misTestsQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive().optional(),
});

export const misTestParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
