import { z } from 'zod';

export const marcadaParamsSchema = z.object({
  preguntaId: z.coerce.number().int().positive(),
});
