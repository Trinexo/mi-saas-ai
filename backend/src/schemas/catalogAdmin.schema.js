import { z } from 'zod';

const nombre = z.string().min(2).max(200);
const descripcion = z.string().max(500).optional();

export const createOposicionSchema = z.object({ nombre, descripcion });

export const listOposicionesQuerySchema = z.object({
  q:         z.string().optional(),
  estado:    z.enum(['activa', 'borrador', 'inactiva']).optional(),
  categoria: z.string().optional(),
  page:      z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const updateOposicionSchema = z.object({
  nombre:                 nombre.optional(),
  descripcion:            descripcion,
  tiempo_limite_minutos:  z.coerce.number().int().min(1).max(600).nullable().optional(),
  categoria:              z.string().max(100).nullable().optional(),
  estado:                 z.enum(['activa', 'borrador', 'inactiva']).optional(),
}).refine(
  (d) =>
    d.nombre !== undefined ||
    d.descripcion !== undefined ||
    d.tiempo_limite_minutos !== undefined ||
    d.categoria !== undefined ||
    d.estado !== undefined,
  { message: 'Proporciona al menos un campo a actualizar' },
);

export const createTemaSchema = z.object({
  oposicion_id: z.coerce.number().int().positive(),
  nombre,
});

export const updateTemaSchema = z.object({ nombre });

export const createBloqueSchema = z.object({
  tema_id: z.coerce.number().int().positive(),
  nombre,
});

export const updateBloqueSchema = z.object({ nombre });
