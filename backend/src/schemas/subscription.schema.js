import { z } from 'zod';

export const assignPlanSchema = z.object({
  plan: z.enum(['free', 'pro', 'elite']),
  fecha_fin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato requerido: YYYY-MM-DD')
    .optional(),
  notas: z.string().max(500).optional(),
});

export const listSuscripcionesQuerySchema = z.object({
  plan: z.enum(['free', 'pro', 'elite']).optional(),
  estado: z.enum(['activa', 'cancelada', 'expirada']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
