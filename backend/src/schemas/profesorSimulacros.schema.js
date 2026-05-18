import { z } from 'zod';

export const misTestsQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive().optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export const misSimulacrosQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive().optional(),
  estado: z.enum(['borrador', 'publicado', 'archivado']).optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export const createSimulacroProfesorSchema = z.object({
  nombre: z.string().min(3).max(255),
  descripcion: z.string().max(1000).optional(),
  oposicion_id: z.number().int().positive().optional().nullable(),
  tiempo_limite_segundos: z.number().int().positive().optional().nullable(),
  puntuacion_maxima: z.number().positive().optional().nullable(),
  penalizacion: z.number().min(0).max(1).optional().nullable(),
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
  orden: z.number().int().min(0).optional(),
  numero_preguntas: z.number().int().min(0).optional(),
});

export const updateBloqueProfesorSchema = z.object({
  nombre: z.string().min(1).max(255).optional(),
  orden: z.number().int().min(0).optional(),
  numero_preguntas: z.number().int().min(0).optional(),
}).refine(d => Object.keys(d).length > 0, { message: 'Proporciona al menos un campo' });

export const asignarPreguntasProfesorSchema = z.object({
  pregunta_ids: z.array(z.number().int().positive()).min(1).max(200),
});

export const simulacroIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const bloqueIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  bloqueId: z.coerce.number().int().positive(),
});

export const preguntaIdProfesorParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  bloqueId: z.coerce.number().int().positive(),
  preguntaId: z.coerce.number().int().positive(),
});
