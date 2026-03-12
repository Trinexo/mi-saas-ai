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