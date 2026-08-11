import { z } from 'zod';

const MAX_POSTGRES_BIGINT = 9223372036854775807n;

const bigintIdSchema = z.string()
  .regex(/^[1-9]\d*$/, 'Debe ser un entero decimal positivo')
  .refine((value) => !/^[1-9]\d*$/.test(value) || BigInt(value) <= MAX_POSTGRES_BIGINT, 'Excede BIGINT');

const legacyOposicionIdSchema = bigintIdSchema;

const fechaSchema = z.string().trim().min(1);
const motivoSchema = z.string().trim().min(1).max(1000);
const modelosSchema = z.array(z.enum(['experto', 'guiado'])).min(1).max(2)
  .refine((modelos) => new Set(modelos).size === modelos.length, 'No puede haber modelos duplicados');

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
  oposicionId: legacyOposicionIdSchema,
});

export const accessContextParamSchema = z.object({
  oposicionId: legacyOposicionIdSchema,
});

export const accessModeParamSchema = z.object({
  accesoId: z.string()
    .regex(/^[1-9]\d*$/, 'accesoId debe ser un entero decimal positivo')
    .refine((value) => BigInt(value) <= MAX_POSTGRES_BIGINT, 'accesoId excede BIGINT'),
});

export const accessModeBodySchema = z.object({
  modo: z.enum(['experto', 'guiado']),
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
  motivo: motivoSchema.optional(),
});

export const editarAccesoBodySchema = z.object({
  fechaFin: z.string().trim().min(1).nullable().optional(),
  precioPagado: z.coerce.number().nonnegative().nullable().optional(),
  notas: z.string().nullable().optional(),
  estado: z.enum(['activo', 'cancelado', 'revocado', 'expirado']).optional(),
  tipoAlumno: z.enum(['libre', 'albacer']).optional(),
  modoPreparacion: z.enum(['experto', 'albacer']).optional(),
  motivo: motivoSchema.optional(),
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

export const adminAccesoIdParamSchema = z.object({ accesoId: bigintIdSchema });

export const adminCrearAccesoBodySchema = z.object({
  usuarioId: bigintIdSchema,
  oposicionId: bigintIdSchema,
  modelos: modelosSchema,
  modoActivo: z.enum(['experto', 'guiado']).optional(),
  vigencia: z.object({
    fechaInicio: fechaSchema,
    fechaFin: fechaSchema.nullable(),
  }),
  tipoAlumno: z.enum(['libre', 'albacer']).optional().default('libre'),
  precioPagado: z.number().nonnegative().nullable().optional().default(null),
  notas: z.string().nullable().optional().default(null),
  motivo: motivoSchema,
});

export const adminModelosBodySchema = z.object({
  modelos: modelosSchema,
  modoActivo: z.enum(['experto', 'guiado']).nullable().optional(),
  motivo: motivoSchema,
});

export const adminVigenciaBodySchema = z.object({
  fechaInicio: fechaSchema.optional(),
  fechaFin: fechaSchema.nullable().optional(),
  motivo: motivoSchema,
}).refine((body) => body.fechaInicio !== undefined || body.fechaFin !== undefined, {
  message: 'Debe indicarse al menos una fecha',
});

export const adminDatosComercialesBodySchema = z.object({
  precioPagado: z.number().nonnegative().nullable().optional(),
  notas: z.string().nullable().optional(),
  tipoAlumno: z.enum(['libre', 'albacer']).optional(),
  motivo: motivoSchema,
}).refine((body) => body.precioPagado !== undefined
  || body.notas !== undefined
  || body.tipoAlumno !== undefined, {
  message: 'Debe indicarse al menos un campo comercial',
});

const adminLifecycleVigenciaSchema = z.object({
  fechaInicio: fechaSchema.optional(),
  fechaFin: fechaSchema.nullable().optional(),
});

export const adminMotivoBodySchema = z.object({ motivo: motivoSchema });

export const adminRenovarBodySchema = adminLifecycleVigenciaSchema.extend({
  modelos: modelosSchema.optional(),
  modoActivo: z.enum(['experto', 'guiado']).nullable().optional(),
  motivo: motivoSchema,
});

export const adminReactivarBodySchema = adminRenovarBodySchema;
