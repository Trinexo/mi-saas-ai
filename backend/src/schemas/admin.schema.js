import { z } from 'zod';

const opcionSchema = z.object({
  texto: z.string().min(1),
  correcta: z.boolean(),
});

const basePreguntaSchema = {
  temaId: z.number().int().positive(),
  enunciado: z.string().min(10),
  explicacion: z.string().min(2),
  referenciaNormativa: z.string().optional().nullable(),
  nivelDificultad: z.number().int().min(1).max(5),
  opciones: z.array(opcionSchema).length(4),
};

export const createPreguntaSchema = z.object(basePreguntaSchema).refine(
  (payload) => payload.opciones.filter((o) => o.correcta).length === 1,
  {
    message: 'Debe existir una única opción correcta',
    path: ['opciones'],
  },
);

export const updatePreguntaSchema = createPreguntaSchema;

export const importPreguntasCsvSchema = z.object({
  csv: z.string().min(1),
  delimiter: z.string().length(1).optional().default(','),
});

export const updateReporteEstadoSchema = z.object({
  estado: z.enum(['abierto', 'en_revision', 'resuelto', 'descartado']),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listReportesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
  estado: z.enum(['abierto', 'en_revision', 'resuelto', 'descartado']).optional(),
});

export const listPreguntasQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
  oposicion_id: z.coerce.number().int().positive().optional(),
  materia_id: z.coerce.number().int().positive().optional(),
  tema_id: z.coerce.number().int().positive().optional(),
  nivel_dificultad: z.coerce.number().int().min(1).max(5).optional(),
});

export const listAuditoriaQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(50),
  pregunta_id: z.coerce.number().int().positive().optional(),
  usuario_id: z.coerce.number().int().positive().optional(),
  accion: z.enum(['create', 'update', 'delete']).optional(),
});