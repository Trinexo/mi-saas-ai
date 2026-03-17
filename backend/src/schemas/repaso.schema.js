import { z } from 'zod';

export const repasoPendientesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
