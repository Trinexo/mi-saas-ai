import { z } from 'zod';

export const marcadaParamsSchema = z.object({
  preguntaId: z.coerce.number().int().positive(),
});

export const marcadasQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive().optional(),
});
