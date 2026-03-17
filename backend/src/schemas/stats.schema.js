import { z } from 'zod';

export const temaStatsQuerySchema = z.object({
  tema_id: z.coerce.number().int().positive(),
});

export const repasoStatsQuerySchema = z.object({
  tema_id: z.coerce.number().int().positive(),
});

export const simulacrosStatsQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive(),
});

export const evolucionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});
