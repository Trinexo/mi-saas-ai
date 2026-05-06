import { z } from 'zod';

export const listEtiquetasQuerySchema = z.object({
  q:         z.string().optional(),
  page:      z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export const createEtiquetaSchema = z.object({
  nombre:      z.string().min(1).max(100),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color debe ser un hex válido (#rrggbb)').optional().nullable(),
  descripcion: z.string().max(500).optional().nullable(),
});

export const updateEtiquetaSchema = z.object({
  nombre:      z.string().min(1).max(100).optional(),
  color:       z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color debe ser un hex válido (#rrggbb)').nullable().optional(),
  descripcion: z.string().max(500).nullable().optional(),
}).refine(
  (d) => d.nombre !== undefined || d.color !== undefined || d.descripcion !== undefined,
  { message: 'Proporciona al menos un campo a actualizar' },
);

export const setEtiquetasDePreguntaSchema = z.object({
  etiqueta_ids: z.array(z.number().int().positive()).max(20),
});

export const etiquetaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const preguntaEtiquetasParamSchema = z.object({
  preguntaId: z.coerce.number().int().positive(),
});
