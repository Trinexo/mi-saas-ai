import { z } from 'zod';

export const simulacrosPublicosQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive().optional(),
});

export const simulacroPublicadoParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
