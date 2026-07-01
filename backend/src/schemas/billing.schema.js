import { z } from 'zod';

export const checkoutSessionBodySchema = z.object({
  oposicionId: z.coerce.number().int().positive(),
});

export const billingOposicionParamSchema = z.object({
  oposicionId: z.coerce.number().int().positive(),
});

export const patchPrecioBodySchema = z.object({
  precioEuros: z.coerce.number().positive().max(9999),
});
