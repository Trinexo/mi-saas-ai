import { z } from 'zod';

export const temasByOposicionQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive(),
});

export const bloquesQuerySchema = z.object({
  tema_id: z.coerce.number().int().positive(),
});

export const temasQuerySchema = z.object({
  materia_id: z.coerce.number().int().positive(),
});

export const preguntasQuerySchema = z.object({
  bloque_id: z.coerce.number().int().positive().optional(),
  tema_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
}).refine(
  (query) => query.bloque_id !== undefined || query.tema_id !== undefined,
  { message: 'bloque_id o tema_id es obligatorio' },
);

// Compatibilidad con tests y código legacy previo al refactor materias/temas -> temas/bloques.
export const materiasQuerySchema = temasByOposicionQuerySchema;
