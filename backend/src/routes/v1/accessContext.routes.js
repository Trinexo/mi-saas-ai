import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { changeModoActivo, getContextoAcceso } from '../../controllers/accesoOposicion.controller.js';
import { accessContextParamSchema, accessModeBodySchema, accessModeParamSchema } from '../../schemas/accesoOposicion.schema.js';

const router = Router();

router.get(
  '/contexto/:oposicionId',
  requireAuth,
  requireRole('alumno'),
  validate(accessContextParamSchema, 'params'),
  getContextoAcceso,
);

router.patch(
  '/:accesoId/modo-activo',
  requireAuth,
  requireRole('alumno'),
  validate(accessModeParamSchema, 'params'),
  validate(accessModeBodySchema, 'body'),
  changeModoActivo,
);

export default router;
