import { z } from 'zod';

const id = z.coerce.number().int().positive();
const nonNegativeInt = z.coerce.number().int().min(0);

export const misTestsQuerySchema = z.object({
  oposicion_id: id.optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export const misSimulacrosQuerySchema = z.object({
  oposicion_id: id.optional(),
  estado: z.enum(['borrador', 'publicado', 'archivado']).optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export const createSimulacroProfesorSchema = z.object({
  nombre: z.string().min(3).max(255),
  descripcion: z.string().max(1000).optional(),
  oposicion_id: id.optional().nullable(),
  tiempo_limite_segundos: id.optional().nullable(),
  puntuacion_maxima: z.coerce.number().positive().optional().nullable(),
  penalizacion: z.coerce.number().min(0).max(1).optional().nullable(),
  mostrar_resultados_al_final: z.boolean().optional(),
  fecha_publicacion: z.string().datetime().optional().nullable(),
});

export const updateSimulacroProfesorSchema = createSimulacroProfesorSchema
  .extend({
    estado: z.enum(['borrador', 'publicado', 'archivado']).optional(),
  })
  .partial();

export const createBloqueProfesorSchema = z.object({
  nombre: z.string().min(1).max(255),
  orden: nonNegativeInt.optional(),
  numero_preguntas: nonNegativeInt.optional(),
});

export const updateBloqueProfesorSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  orden: nonNegativeInt.optional(),
  numero_preguntas: nonNegativeInt.optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Proporciona al menos un campo' });

export const asignarPreguntasProfesorSchema = z.object({
  pregunta_ids: z.array(id).min(1).max(200),
});

export const simulacroIdParamSchema = z.object({
  id,
});

export const bloqueIdParamSchema = z.object({
  id,
  bloqueId: id,
});

export const preguntaIdProfesorParamSchema = z.object({
  id,
  bloqueId: id,
  preguntaId: id,
});
