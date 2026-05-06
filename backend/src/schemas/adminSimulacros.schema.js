import { z } from 'zod';

export const listSimulacrosQuerySchema = z.object({
  q:           z.string().optional(),
  estado:      z.enum(['borrador', 'publicado', 'archivado']).optional(),
  oposicion_id: z.coerce.number().int().positive().optional(),
  page:        z.coerce.number().int().positive().optional().default(1),
  page_size:   z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const createSimulacroSchema = z.object({
  nombre:                      z.string().min(3).max(200),
  descripcion:                 z.string().max(1000).optional(),
  oposicion_id:                z.number().int().positive().optional().nullable(),
  estado:                      z.enum(['borrador', 'publicado', 'archivado']).optional().default('borrador'),
  tiempo_limite_segundos:      z.number().int().positive().optional().nullable(),
  puntuacion_maxima:           z.number().positive().optional().default(100),
  penalizacion:                z.number().min(0).optional().default(0),
  mostrar_resultados_al_final: z.boolean().optional().default(true),
  fecha_publicacion:           z.string().datetime().optional().nullable(),
});

export const updateSimulacroSchema = z.object({
  nombre:                      z.string().min(3).max(200).optional(),
  descripcion:                 z.string().max(1000).nullable().optional(),
  oposicion_id:                z.number().int().positive().nullable().optional(),
  estado:                      z.enum(['borrador', 'publicado', 'archivado']).optional(),
  tiempo_limite_segundos:      z.number().int().positive().nullable().optional(),
  puntuacion_maxima:           z.number().positive().optional(),
  penalizacion:                z.number().min(0).optional(),
  mostrar_resultados_al_final: z.boolean().optional(),
  fecha_publicacion:           z.string().datetime().nullable().optional(),
}).refine(
  (d) => Object.keys(d).length > 0,
  { message: 'Proporciona al menos un campo a actualizar' },
);

export const createBloqueSchema = z.object({
  nombre: z.string().min(2).max(200),
  orden:  z.number().int().min(0).optional().default(0),
});

export const updateBloqueSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  orden:  z.number().int().min(0).optional(),
}).refine(
  (d) => d.nombre !== undefined || d.orden !== undefined,
  { message: 'Proporciona al menos un campo a actualizar' },
);

export const asignarPreguntasSchema = z.object({
  pregunta_ids: z.array(z.number().int().positive()).min(1).max(200),
});

export const simulacroIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const bloqueIdParamSchema = z.object({
  id:       z.coerce.number().int().positive(),
  bloqueId: z.coerce.number().int().positive(),
});

export const preguntaIdParamSchema = z.object({
  id:         z.coerce.number().int().positive(),
  bloqueId:   z.coerce.number().int().positive(),
  preguntaId: z.coerce.number().int().positive(),
});
