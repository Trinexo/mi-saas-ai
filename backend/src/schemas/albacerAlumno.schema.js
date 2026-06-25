import { z } from 'zod';

export const albacerAlumnoEstadoQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive(),
});

export const albacerAlumnoItemParamSchema = z.object({
  itemId: z.coerce.number().int().positive(),
});

export const albacerAlumnoModuloParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
