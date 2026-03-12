import { z } from 'zod';

export const generateTestSchema = z.object({
  temaId: z.number().int().positive(),
  numeroPreguntas: z.number().int().min(5).max(100),
});

export const submitTestSchema = z.object({
  testId: z.number().int().positive(),
  respuestas: z
    .array(
      z.object({
        preguntaId: z.number().int().positive(),
        respuestaId: z.number().int().positive().nullable(),
      }),
    )
    .min(1),
  tiempoSegundos: z.number().int().nonnegative().default(0),
});