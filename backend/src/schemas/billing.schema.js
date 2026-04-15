import { z } from 'zod';

export const checkoutSessionBodySchema = z.object({
  oposicionId: z.coerce.number().int().positive(),
});

export const patchPrecioBodySchema = z.object({
  precioEuros: z.number().positive().max(9999),
});
