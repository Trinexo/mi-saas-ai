import { z } from 'zod';

const id = z.coerce.number().int().positive();

export const planEstudioQuerySchema = z.object({
  oposicion_id: id,
});

export const planEstudioIdParamSchema = z.object({
  id,
});
