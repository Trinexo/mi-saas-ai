import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { empezarPlanEstudio, listPlanEstudio } from '../../controllers/planEstudio.controller.js';
import { planEstudioIdParamSchema, planEstudioQuerySchema } from '../../schemas/planEstudio.schema.js';

const router = Router();

router.use(requireAuth, requireRole('alumno'));
router.get('/', validate(planEstudioQuerySchema, 'query'), listPlanEstudio);
router.post('/:id/empezar', validate(planEstudioIdParamSchema, 'params'), empezarPlanEstudio);

export default router;
