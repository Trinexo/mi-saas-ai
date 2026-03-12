import { z } from 'zod';

export const temaStatsQuerySchema = z.object({
  tema_id: z.coerce.number().int().positive(),
});
