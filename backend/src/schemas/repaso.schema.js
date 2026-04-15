import { z } from 'zod';

export const repasoPendientesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const repasoActualizarBodySchema = z.object({
  respuestas: z
    .array(
      z.object({
        preguntaId: z.coerce.number().int().positive(),
        acertada: z.boolean(),
      }),
    )
    .min(1)
    .max(200),
});
