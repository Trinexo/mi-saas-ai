import { z } from 'zod';

const temaIdsSchema = z.array(z.number().int().positive()).max(100);

export const albacerModuloIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listAlbacerModulosQuerySchema = z.object({
  q: z.string().trim().optional(),
  estado: z.enum(['borrador', 'publicado', 'archivado']).optional(),
  oposicion_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const createAlbacerModuloSchema = z.object({
  oposicion_id: z.number().int().positive(),
  nombre: z.string().trim().min(3).max(200),
  descripcion: z.string().trim().max(2000).nullable().optional(),
  orden: z.number().int().min(0).optional().default(0),
  estado: z.enum(['borrador', 'publicado', 'archivado']).optional().default('borrador'),
  tema_ids: temaIdsSchema.optional().default([]),
});

export const updateAlbacerModuloSchema = z.object({
  oposicion_id: z.number().int().positive().optional(),
  nombre: z.string().trim().min(3).max(200).optional(),
  descripcion: z.string().trim().max(2000).nullable().optional(),
  orden: z.number().int().min(0).optional(),
  estado: z.enum(['borrador', 'publicado', 'archivado']).optional(),
  tema_ids: temaIdsSchema.optional(),
}).refine(
  (payload) => Object.keys(payload).length > 0,
  { message: 'Proporciona al menos un campo a actualizar' },
);

export const albacerModuloItemIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
});

export const createAlbacerModuloItemSchema = z.object({
  tipo: z.enum(['test', 'simulacro_final']),
  titulo: z.string().trim().min(3).max(200),
  descripcion: z.string().trim().max(2000).nullable().optional(),
  plantilla_test_id: z.number().int().positive().optional(),
  simulacro_id: z.number().int().positive().optional(),
  orden: z.number().int().min(0).optional(),
  obligatorio: z.boolean().optional().default(false),
}).superRefine((payload, ctx) => {
  if (payload.tipo === 'test' && !payload.plantilla_test_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['plantilla_test_id'], message: 'Selecciona un test' });
  }
  if (payload.tipo === 'simulacro_final' && !payload.simulacro_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['simulacro_id'], message: 'Selecciona un simulacro final' });
  }
  if (payload.tipo === 'test' && payload.simulacro_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['simulacro_id'], message: 'Un item de test no puede tener simulacro' });
  }
  if (payload.tipo === 'simulacro_final' && payload.plantilla_test_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['plantilla_test_id'], message: 'Un simulacro final no puede tener test' });
  }
});

export const updateAlbacerModuloItemSchema = z.object({
  titulo: z.string().trim().min(3).max(200).optional(),
  descripcion: z.string().trim().max(2000).nullable().optional(),
  orden: z.number().int().min(0).optional(),
  obligatorio: z.boolean().optional(),
}).refine(
  (payload) => Object.keys(payload).length > 0,
  { message: 'Proporciona al menos un campo a actualizar' },
);

export const createAlbacerModuloTestSchema = z.object({
  nombre: z.string().trim().min(3).max(200).optional(),
  descripcion: z.string().trim().max(2000).nullable().optional(),
  orden: z.number().int().min(0).optional(),
  estado: z.enum(['borrador', 'publicado', 'archivado']).optional().default('borrador'),
  nivel_dificultad: z.enum(['facil', 'media', 'dificil']).optional().nullable(),
  duracion_minutos: z.number().int().positive().optional().nullable(),
  mezclar_preguntas: z.boolean().optional().default(true),
  mostrar_resultados: z.boolean().optional().default(true),
  mostrar_explicaciones: z.boolean().optional().default(false),
  tipo_puntuacion: z.enum(['estandar', 'personalizada']).optional().default('estandar'),
  pts_acierto: z.number().optional().default(1),
  pts_fallo: z.number().optional().default(-0.25),
  pts_blanco: z.number().optional().default(0),
});

export const albacerModuloUsedQuestionsQuerySchema = z.object({
  except_test_id: z.coerce.number().int().positive().optional(),
});
