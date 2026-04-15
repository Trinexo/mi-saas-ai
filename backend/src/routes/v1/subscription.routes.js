import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { assignPlanSchema, listSuscripcionesQuerySchema } from '../../schemas/subscription.schema.js';
import { idParamSchema } from '../../schemas/admin.schema.js';
import { getMyPlan, assignPlan, listSuscripciones, getSubscriptionStats } from '../../controllers/subscription.controller.js';

const router = Router();

// --- Usuario: consulta su propio plan ---
router.get('/me', requireAuth, getMyPlan);

// --- Admin: gestión de suscripciones ---
router.get('/stats', requireAuth, requireRole('admin'), getSubscriptionStats);
router.get('/', requireAuth, requireRole('admin'), validate(listSuscripcionesQuerySchema, 'query'), listSuscripciones);
router.post('/users/:userId', requireAuth, requireRole('admin'), validate(idParamSchema, 'params'), validate(assignPlanSchema), assignPlan);

export default router;
