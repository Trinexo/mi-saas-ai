import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getContextoAcceso } from '../../controllers/accesoOposicion.controller.js';
import { accessContextParamSchema } from '../../schemas/accesoOposicion.schema.js';

const router = Router();

router.get(
  '/contexto/:oposicionId',
  requireAuth,
  requireRole('alumno'),
  validate(accessContextParamSchema, 'params'),
  getContextoAcceso,
);

export default router;
