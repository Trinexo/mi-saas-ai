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
  (d) => ['simulacro', 'marcadas'].includes(d.modo) || d.temaId != null || d.oposicionId != null,
  { message: 'Se requiere temaId u oposicionId para este modo', path: ['temaId'] },
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
  page: z.coerce.number().int().min(1).default(1),
  oposicion_id: z.coerce.number().int().positive().optional(),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const reviewParamsSchema = z.object({
  testId: z.coerce.number().int().positive(),
});