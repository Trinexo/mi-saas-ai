import { z } from 'zod';

const nombre = z.string().min(2).max(200);
const descripcion = z.string().max(500).optional();

export const createOposicionSchema = z.object({ nombre, descripcion });

export const updateOposicionSchema = z.object({
  nombre: nombre.optional(),
  descripcion: descripcion,
}).refine((d) => d.nombre !== undefined || d.descripcion !== undefined, {
  message: 'Proporciona al menos un campo a actualizar',
});

export const createMateriaSchema = z.object({
  oposicion_id: z.coerce.number().int().positive(),
  nombre,
});

export const updateMateriaSchema = z.object({ nombre });

export const createTemaSchema = z.object({
  materia_id: z.coerce.number().int().positive(),
  nombre,
});

export const updateTemaSchema = z.object({ nombre });
