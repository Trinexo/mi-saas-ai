import { z } from 'zod';

export const bloqueStatsQuerySchema = z.object({
  bloque_id: z.coerce.number().int().positive(),
});

export const repasoStatsQuerySchema = z.object({
  bloque_id: z.coerce.number().int().positive(),
});

export const simulacrosStatsQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive(),
  modo_preparacion: z.enum(['experto', 'albacer']).optional().default('experto'),
  albacer_modulo_id: z.coerce.number().int().positive().optional(),
});

export const evolucionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  oposicion_id: z.coerce.number().int().positive().optional(),
  modo_preparacion: z.enum(['experto', 'albacer']).optional().default('experto'),
  albacer_modulo_id: z.coerce.number().int().positive().optional(),
});

export const statsContextQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive().optional(),
  modo_preparacion: z.enum(['experto', 'albacer']).optional().default('experto'),
  albacer_modulo_id: z.coerce.number().int().positive().optional(),
});

export const statsOposicionContextQuerySchema = statsContextQuerySchema.extend({
  oposicion_id: z.coerce.number().int().positive(),
});

export const statsTemaContextQuerySchema = statsContextQuerySchema.extend({
  tema_id: z.coerce.number().int().positive(),
});

export const statsRankingQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive().optional(),
});

export const statsBloqueDetalleParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
