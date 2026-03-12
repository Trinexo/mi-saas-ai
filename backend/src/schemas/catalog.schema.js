import { z } from 'zod';

export const materiasQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive(),
});

export const temasQuerySchema = z.object({
  materia_id: z.coerce.number().int().positive(),
});

export const preguntasQuerySchema = z.object({
  tema_id: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
});
