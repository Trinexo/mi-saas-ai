import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { empezarPlanEstudio, listPlanEstudio } from '../../controllers/planEstudio.controller.js';

const router = Router();

const planEstudioQuerySchema = z.object({
  oposicion_id: z.coerce.number().int().positive(),
});

const planEstudioIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

router.use(requireAuth, requireRole('alumno'));
router.get('/', validate(planEstudioQuerySchema, 'query'), listPlanEstudio);
router.post('/:id/empezar', validate(planEstudioIdParamSchema, 'params'), empezarPlanEstudio);

export default router;
