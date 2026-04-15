import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { loadUserPlan, requirePlan } from '../../middleware/plan.middleware.js';
import { repasoPendientesQuerySchema, repasoActualizarBodySchema } from '../../schemas/repaso.schema.js';
import { getRepasoPendientes, postActualizarRepaso } from '../../controllers/repaso.controller.js';

const router = Router();

// Ver pendientes: requiere plan pro o superior
router.get(
  '/pendientes',
  requireAuth,
  loadUserPlan,
  requirePlan('pro', 'la repetición espaciada'),
  validate(repasoPendientesQuerySchema, 'query'),
  getRepasoPendientes,
);

// Actualizar SM-2: cualquier usuario autenticado puede registrar su progreso
router.post(
  '/actualizar',
  requireAuth,
  validate(repasoActualizarBodySchema, 'body'),
  postActualizarRepaso,
);

export default router;
