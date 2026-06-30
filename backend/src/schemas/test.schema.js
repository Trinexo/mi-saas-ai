import { z } from 'zod';

const temasMixItemSchema = z.object({
  temaId: z.coerce.number().int().positive(),
  pct: z.coerce.number().int().min(1).max(100),
});

export const generateTestSchema = z.object({
  temaId: z.coerce.number().int().positive().optional(),
  bloqueId: z.coerce.number().int().positive().optional(),
  temasMix: z.array(temasMixItemSchema).min(2).max(10).optional(),
  oposicionId: z.coerce.number().int().positive().optional(),
  numeroPreguntas: z.coerce.number().int().min(1).max(200),
  modo: z.enum(['normal', 'adaptativo', 'repaso', 'simulacro', 'marcadas']).optional().default('adaptativo'),
  dificultad: z.enum(['facil', 'media', 'dificil', 'mixto']).optional().default('mixto'),
  duracionSegundos: z.coerce.number().int().positive().optional(),
  feedbackInmediato: z.boolean().optional().default(false),
}).refine(
  (d) => d.modo !== 'simulacro' || d.oposicionId != null,
  { message: 'El modo simulacro requiere oposicionId', path: ['oposicionId'] },
).refine(
  (d) => d.modo !== 'marcadas' || d.oposicionId != null,
  { message: 'El modo marcadas requiere oposicionId', path: ['oposicionId'] },
).refine(
  (d) => d.modo !== 'repaso' || d.bloqueId != null || d.temaId != null || d.oposicionId != null,
  { message: 'El modo repaso requiere bloqueId, temaId u oposicionId', path: ['oposicionId'] },
).refine(
  (d) => ['simulacro', 'marcadas', 'repaso'].includes(d.modo) || d.temasMix != null || d.temaId != null || d.oposicionId != null,
  { message: 'Se requiere temaId, temasMix u oposicionId para este modo', path: ['temaId'] },
);

export const generateRefuerzoSchema = z.object({
  temaId: z.coerce.number().int().positive().optional(),
  oposicionId: z.coerce.number().int().positive().optional(),
  numeroPreguntas: z.number().int().min(1).max(100).default(10),
}).refine(
  (d) => d.temaId != null || d.oposicionId != null,
  { message: 'El refuerzo requiere temaId u oposicionId', path: ['oposicionId'] },
);

export const generateDemoSchema = z.object({
  oposicionId: z.coerce.number().int().positive(),
});

export const submitTestSchema = z.object({
  testId: z.coerce.number().int().positive(),
  respuestas: z
    .array(
      z.object({
        preguntaId: z.coerce.number().int().positive(),
        respuestaId: z.coerce.number().int().positive().nullable(),
      }),
    )
    .default([]),
  tiempoSegundos: z.coerce.number().int().nonnegative().default(0),
});

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
  oposicion_id: z.coerce.number().int().positive().optional(),
  modo_preparacion: z.enum(['experto', 'albacer']).optional().default('experto'),
  albacer_modulo_id: z.coerce.number().int().positive().optional(),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const reviewParamsSchema = z.object({
  testId: z.coerce.number().int().positive(),
});

export const testOposicionQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive().optional(),
});

export const testPendientesQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive().optional(),
  modo_preparacion: z.enum(['experto', 'albacer']).optional(),
});

export const testIdParamsSchema = z.object({
  testId: z.coerce.number().int().positive(),
});
