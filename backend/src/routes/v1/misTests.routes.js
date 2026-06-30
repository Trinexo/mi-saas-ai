import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { loadUserPlan } from '../../middleware/plan.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getMisTestsPublicados, iniciarMiTest } from '../../controllers/misTests.controller.js';
import { misTestParamsSchema, misTestsQuerySchema } from '../../schemas/misTests.schema.js';

const router = Router();

// GET  /api/mis-tests          → tests publicados del profesor accesibles al alumno
router.get('/', requireAuth, loadUserPlan, validate(misTestsQuerySchema, 'query'), getMisTestsPublicados);

// POST /api/mis-tests/:id/iniciar → genera sesión de test a partir de plantilla publicada
router.post('/:id/iniciar', requireAuth, validate(misTestParamsSchema, 'params'), iniciarMiTest);

export default router;
