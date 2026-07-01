import { z } from 'zod';

export const listNotificacionesQuerySchema = z.object({
  page:           z.coerce.number().int().positive().optional().default(1),
  page_size:      z.coerce.number().int().min(1).max(100).optional().default(20),
  solo_no_leidas: z.preprocess(
    (value) => {
      if (value === undefined) return false;
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    },
    z.boolean()
  ),
});

export const notificacionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
