import { z } from 'zod';

const booleanLikeSchema = z.preprocess(
  (value) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  },
  z.boolean().optional()
);

export const accesoOposicionParamSchema = z.object({
  oposicionId: z.coerce.number().int().positive(),
});

export const accesoUsuarioOposicionParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
  oposicionId: z.coerce.number().int().positive(),
});

export const accesosListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
  email: z.string().trim().min(1).optional(),
  oposicion_id: z.coerce.number().int().positive().optional(),
});

export const asignarAccesoBodySchema = z.object({
  email: z.string().trim().email(),
  oposicionId: z.coerce.number().int().positive(),
  fechaFin: z.string().trim().min(1).nullable().optional(),
  precioPagado: z.coerce.number().nonnegative().nullable().optional(),
  notas: z.string().nullable().optional(),
  tipoAlumno: z.enum(['libre', 'albacer']).optional().default('libre'),
  modoPreparacion: z.enum(['experto', 'albacer']).optional().default('albacer'),
});

export const editarAccesoBodySchema = z.object({
  fechaFin: z.string().trim().min(1).nullable().optional(),
  precioPagado: z.coerce.number().nonnegative().nullable().optional(),
  notas: z.string().nullable().optional(),
  estado: z.enum(['activo', 'cancelado', 'expirado']).optional(),
  tipoAlumno: z.enum(['libre', 'albacer']).optional(),
  modoPreparacion: z.enum(['experto', 'albacer']).optional(),
});

export const preparacionAccesoBodySchema = z.object({
  modoPreparacion: z.enum(['experto', 'albacer']).optional(),
  modo_preparacion: z.enum(['experto', 'albacer']).optional(),
  rankingPublico: booleanLikeSchema,
  ranking_publico: booleanLikeSchema,
}).refine(
  (body) => body.modoPreparacion != null
    || body.modo_preparacion != null
    || body.rankingPublico != null
    || body.ranking_publico != null,
  { message: 'modoPreparacion o rankingPublico es requerido' },
);
