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
