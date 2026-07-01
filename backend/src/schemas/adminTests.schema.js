import { z } from 'zod';

const id = z.coerce.number().int().positive();
const positiveInt = z.coerce.number().int().positive();
const scoreNumber = z.coerce.number().min(-100).max(100);

const estado = z.enum(['borrador', 'publicado', 'archivado']);
const dificultad = z.enum(['facil', 'media', 'dificil']).nullable().optional();
const tipoPuntuacion = z.enum(['estandar', 'personalizada']).optional();
const scope = z.enum(['experto', 'albacer_modulo', 'sugerido_profesor']);

const testBaseSchema = z.object({
  nombre: z.string().trim().min(1).max(255),
  descripcion: z.string().max(3000).optional().nullable(),
  oposicion_id: id.optional().nullable(),
  tema_id: id.optional().nullable(),
  tema_ids: z.array(id).max(100).optional().default([]),
  estado: estado.optional().default('borrador'),
  nivel_dificultad: dificultad,
  duracion_minutos: positiveInt.optional().nullable(),
  mezclar_preguntas: z.boolean().optional().default(true),
  mostrar_resultados: z.boolean().optional().default(true),
  mostrar_explicaciones: z.boolean().optional().default(true),
  tipo_puntuacion: tipoPuntuacion.default('estandar'),
  pts_acierto: scoreNumber.optional().default(1),
  pts_fallo: scoreNumber.optional().default(-0.25),
  pts_blanco: scoreNumber.optional().default(0),
  es_demo: z.boolean().optional(),
});

export const listTestsQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  estado: estado.optional(),
  scope: scope.optional(),
  oposicion_id: id.optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export const createTestSchema = testBaseSchema;

export const updateTestSchema = testBaseSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  { message: 'No hay campos para actualizar' },
);

export const testIdParamSchema = z.object({
  id,
});

export const testPreguntaParamSchema = z.object({
  id,
  preguntaId: id,
});

export const addPreguntasTestSchema = z.object({
  pregunta_ids: z.array(id).min(1).max(500),
});

export const setDemoTestSchema = z.object({
  es_demo: z.boolean(),
});
