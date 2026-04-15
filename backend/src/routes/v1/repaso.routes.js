import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { loadUserPlan, requirePlan } from '../../middleware/plan.middleware.js';
import { repasoPendientesQuerySchema } from '../../schemas/repaso.schema.js';
import { getRepasoPendientes } from '../../controllers/repaso.controller.js';

const router = Router();

// La repetición espaciada requiere plan pro o superior
router.get('/pendientes', requireAuth, loadUserPlan, requirePlan('pro', 'la repetición espaciada'), validate(repasoPendientesQuerySchema, 'query'), getRepasoPendientes);

export default router;
