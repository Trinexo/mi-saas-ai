import { z } from 'zod';

export const reportarPreguntaParamsSchema = z.object({
  preguntaId: z.coerce.number().int().positive(),
});

export const reportarPreguntaBodySchema = z.object({
  motivo: z.string().min(5).max(500),
});
