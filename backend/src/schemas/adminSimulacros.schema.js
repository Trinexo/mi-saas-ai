import { z } from 'zod';

const id = z.coerce.number().int().positive();
const nonNegativeInt = z.coerce.number().int().min(0);

export const listSimulacrosQuerySchema = z.object({
  q:           z.string().optional(),
  estado:      z.enum(['borrador', 'publicado', 'archivado']).optional(),
  oposicion_id: id.optional(),
  scope:       z.enum(['experto', 'albacer_modulo_final', 'sugerido_profesor']).optional(),
  page:        z.coerce.number().int().positive().optional().default(1),
  page_size:   z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const createSimulacroSchema = z.object({
  nombre:                      z.string().min(3).max(200),
  descripcion:                 z.string().max(1000).optional(),
  oposicion_id:                id.optional().nullable(),
  estado:                      z.enum(['borrador', 'publicado', 'archivado']).optional().default('borrador'),
  tiempo_limite_segundos:      id.optional().nullable(),
  puntuacion_maxima:           z.coerce.number().positive().optional().default(100),
  penalizacion:                z.coerce.number().min(0).optional().default(0),
  mostrar_resultados_al_final: z.boolean().optional().default(true),
  fecha_publicacion:           z.string().datetime().optional().nullable(),
});

export const updateSimulacroSchema = z.object({
  nombre:                      z.string().min(3).max(200).optional(),
  descripcion:                 z.string().max(1000).nullable().optional(),
  oposicion_id:                id.nullable().optional(),
  estado:                      z.enum(['borrador', 'publicado', 'archivado']).optional(),
  tiempo_limite_segundos:      id.nullable().optional(),
  puntuacion_maxima:           z.coerce.number().positive().optional(),
  penalizacion:                z.coerce.number().min(0).optional(),
  mostrar_resultados_al_final: z.boolean().optional(),
  fecha_publicacion:           z.string().datetime().nullable().optional(),
}).refine(
  (d) => Object.keys(d).length > 0,
  { message: 'Proporciona al menos un campo a actualizar' },
);

export const createBloqueSchema = z.object({
  nombre:           z.string().min(2).max(200),
  orden:            nonNegativeInt.optional().default(0),
  numero_preguntas: nonNegativeInt.optional().default(0),
});

export const updateBloqueSchema = z.object({
  nombre:           z.string().min(2).max(200).optional(),
  orden:            nonNegativeInt.optional(),
  numero_preguntas: nonNegativeInt.optional(),
}).refine(
  (d) => d.nombre !== undefined || d.orden !== undefined || d.numero_preguntas !== undefined,
  { message: 'Proporciona al menos un campo a actualizar' },
);

export const asignarPreguntasSchema = z.object({
  pregunta_ids: z.array(id).min(1).max(200),
});

export const simulacroIdParamSchema = z.object({
  id,
});

export const bloqueIdParamSchema = z.object({
  id,
  bloqueId: id,
});

export const preguntaIdParamSchema = z.object({
  id,
  bloqueId: id,
  preguntaId: id,
});
