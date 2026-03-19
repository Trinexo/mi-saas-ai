import { z } from 'zod';

export const generateTestSchema = z.object({
  temaId: z.number().int().positive().optional(),
  oposicionId: z.number().int().positive().optional(),
  numeroPreguntas: z.number().int().min(1).max(200),
  modo: z.enum(['normal', 'adaptativo', 'repaso', 'simulacro', 'marcadas']).optional().default('adaptativo'),
  dificultad: z.enum(['facil', 'media', 'dificil', 'mixto']).optional().default('mixto'),
  duracionSegundos: z.number().int().positive().optional(),
}).refine(
  (d) => d.modo !== 'simulacro' || d.oposicionId != null,
  { message: 'El modo simulacro requiere oposicionId', path: ['oposicionId'] },
).refine(
  (d) => ['simulacro', 'marcadas'].includes(d.modo) || d.temaId != null,
  { message: 'Se requiere temaId para este modo', path: ['temaId'] },
);

export const generateRefuerzoSchema = z.object({
  temaId: z.number().int().positive().optional(),
  numeroPreguntas: z.number().int().min(1).max(100).default(10),
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
    .default([]),
  tiempoSegundos: z.number().int().nonnegative().default(0),
});

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const reviewParamsSchema = z.object({
  testId: z.coerce.number().int().positive(),
});