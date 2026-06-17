import { z } from 'zod';

const id = z.coerce.number().int().positive();
const optionalDate = z.string().datetime().optional().nullable();

export const workspaceListQuerySchema = z.object({
  oposicion_id: id.optional(),
  dias: z.coerce.number().int().min(7).max(90).optional(),
  desde: optionalDate,
  hasta: optionalDate,
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
});

export const workspaceAlumnosQuerySchema = workspaceListQuerySchema.extend({
  q: z.string().max(200).optional(),
  estado: z.string().max(50).optional(),
});

export const preguntasProblematicasQuerySchema = workspaceListQuerySchema.extend({
  tema_id: id.optional(),
});

export const actividadFeedQuerySchema = workspaceListQuerySchema.extend({
  tipo: z.enum(['reporte', 'sesion_test']).optional(),
  alumno_id: id.optional(),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(200),
});

export const planificacionIdParamSchema = z.object({
  id,
});

const planificacionBaseSchema = z.object({
  oposicion_id: id,
  tipo: z.enum(['simulacro', 'plantilla_test', 'tema_recomendado']),
  estado: z.enum(['borrador', 'publicada', 'archivada']).default('borrador'),
  titulo: z.string().min(3).max(255),
  descripcion: z.string().max(2000).optional().nullable(),
  fecha_inicio: z.string().datetime(),
  fecha_fin: optionalDate,
  duracion_minutos: z.coerce.number().int().positive().optional().nullable(),
  simulacro_id: id.optional().nullable(),
  plantilla_test_id: id.optional().nullable(),
  tema_ids: z.array(id).max(50).optional().default([]),
  numero_preguntas: z.coerce.number().int().positive().optional().nullable(),
  dificultad: z.enum(['facil', 'media', 'dificil']).optional().nullable(),
  modo_test: z.string().max(80).optional().nullable(),
  intentos_maximos: z.coerce.number().int().positive().optional().nullable(),
  permitir_reintento: z.boolean().optional().default(true),
  resultados_visibles_desde: z.enum(['inmediato', 'cierre']).optional().default('inmediato'),
  revision_visible_desde: z.enum(['inmediato', 'cierre', 'nunca']).optional().default('inmediato'),
  notificar_alumnos: z.boolean().optional().default(false),
});

const planificacionUpdateBaseSchema = z.object({
  oposicion_id: id.optional(),
  tipo: z.enum(['simulacro', 'plantilla_test', 'tema_recomendado']).optional(),
  estado: z.enum(['borrador', 'publicada', 'archivada']).optional(),
  titulo: z.string().min(3).max(255).optional(),
  descripcion: z.string().max(2000).optional().nullable(),
  fecha_inicio: z.string().datetime().optional(),
  fecha_fin: optionalDate,
  duracion_minutos: z.coerce.number().int().positive().optional().nullable(),
  simulacro_id: id.optional().nullable(),
  plantilla_test_id: id.optional().nullable(),
  tema_ids: z.array(id).max(50).optional(),
  numero_preguntas: z.coerce.number().int().positive().optional().nullable(),
  dificultad: z.enum(['facil', 'media', 'dificil']).optional().nullable(),
  modo_test: z.string().max(80).optional().nullable(),
  intentos_maximos: z.coerce.number().int().positive().optional().nullable(),
  permitir_reintento: z.boolean().optional(),
  resultados_visibles_desde: z.enum(['inmediato', 'cierre']).optional(),
  revision_visible_desde: z.enum(['inmediato', 'cierre', 'nunca']).optional(),
  notificar_alumnos: z.boolean().optional(),
});

export const createPlanificacionSchema = planificacionBaseSchema.superRefine((payload, ctx) => {
  if (payload.tipo === 'simulacro' && !payload.simulacro_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['simulacro_id'], message: 'simulacro_id es obligatorio' });
  }
  if (payload.tipo === 'plantilla_test' && !payload.plantilla_test_id) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['plantilla_test_id'], message: 'plantilla_test_id es obligatorio' });
  }
  if (payload.tipo === 'tema_recomendado' && payload.tema_ids.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tema_ids'], message: 'Selecciona al menos un tema' });
  }
});

export const updatePlanificacionSchema = planificacionUpdateBaseSchema.superRefine((payload, ctx) => {
  if (payload.tipo === 'simulacro' && payload.simulacro_id === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['simulacro_id'], message: 'simulacro_id no puede ser null' });
  }
  if (payload.tipo === 'plantilla_test' && payload.plantilla_test_id === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['plantilla_test_id'], message: 'plantilla_test_id no puede ser null' });
  }
});

export const seleccionPreguntasSchema = z.object({
  oposicion_id: id,
  tema_ids: z.array(id).max(100).optional(),
  temas: z.array(z.object({
    tema_id: id,
    cantidad: z.coerce.number().int().positive(),
  })).max(100).optional(),
  cantidad: z.coerce.number().int().positive().optional(),
  dificultad: z.enum(['facil', 'media', 'dificil']).optional().nullable(),
  exclude_ids: z.array(id).max(500).optional().default([]),
  plantilla_test_id: id.optional().nullable(),
  simulacro_id: id.optional().nullable(),
  permitir_completar_con_otros_temas: z.boolean().optional().default(false),
}).superRefine((payload, ctx) => {
  if (payload.temas?.length) return;
  if (!payload.tema_ids?.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tema_ids'], message: 'tema_ids es obligatorio si no se envia temas' });
  }
  if (!payload.cantidad) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cantidad'], message: 'cantidad es obligatoria si no se envia temas' });
  }
});
