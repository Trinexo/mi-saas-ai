import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { getMisTestsPublicados, iniciarMiTest } from '../../controllers/misTests.controller.js';

const router = Router();

// GET  /api/mis-tests          → tests publicados del profesor accesibles al alumno
router.get('/', requireAuth, getMisTestsPublicados);

// POST /api/mis-tests/:id/iniciar → genera sesión de test a partir de plantilla publicada
router.post('/:id/iniciar', requireAuth, iniciarMiTest);

export default router;
