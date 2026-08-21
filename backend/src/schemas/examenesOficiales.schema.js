import { z } from 'zod';

const id = z.union([
  z.string().regex(/^\d+$/),
  z.number().int().safe(),
]).transform((value) => String(value)).refine((value) => {
  const numeric = BigInt(value);
  return numeric > 0n && numeric <= 9223372036854775807n;
}, 'ID BIGINT inválido');

export const examIdParamsSchema = z.object({ id });
export const preguntaExamParamsSchema = z.object({ preguntaId: id });
export const oposicionYearParamsSchema = z.object({ oposicionId: id });
export const officialYearSchema = z.object({ anio: z.number().int().min(1900).max(2200) });
export const questionYearsSchema = z.object({ anioIds: z.array(id) });
export const questionExamsSchema = z.object({ examenIds: z.array(id) });
export const examQuerySchema = z.object({
  oposicionId: id.optional(),
  anio: z.coerce.number().int().min(1900).max(2200).optional(),
  anio_ids: z.string().regex(/^\d+(,\d+)*$/).optional(),
  preguntaId: id.optional(),
});
export const createExamSchema = z.object({
  oposicionId: id,
  nombre: z.string().trim().min(1).max(200),
  anio: z.number().int().min(1900).max(2200),
  convocatoria: z.string().trim().max(200).nullable().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});
export const updateExamSchema = createExamSchema.partial().omit({ oposicionId: true });
export const attachExamQuestionsSchema = z.object({
  preguntaIds: z.array(id).min(1),
  ordenes: z.array(z.number().int().positive().nullable()).optional(),
});
