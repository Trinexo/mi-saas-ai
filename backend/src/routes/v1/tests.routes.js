import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { rateLimit } from '../../middleware/rate-limit.middleware.js';
import { loadUserPlan, requirePlan } from '../../middleware/plan.middleware.js';
import { requireAccesoOposicion } from '../../middleware/acceso.middleware.js';
import { generateTestSchema, submitTestSchema, generateRefuerzoSchema } from '../../schemas/test.schema.js';
import { generateTest, submitTest, getTestHistory, getTestReview, getTestConfig, generateRefuerzo, getTestRecomendado } from '../../controllers/test.controller.js';

const router = Router();

const submitRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	keyBuilder: (req) => req.user?.userId || req.ip,
	message: 'Has enviado demasiados tests en poco tiempo. Espera un minuto.',
});

// generate: valida acceso a la oposición (modo demo si no la tiene) + límites de plan
router.post('/generate', requireAuth, loadUserPlan, requireAccesoOposicion('demo'), validate(generateTestSchema), generateTest);
// generate-refuerzo: requiere plan pro o superior + acceso a la oposición del tema
router.post('/generate-refuerzo', requireAuth, loadUserPlan, requirePlan('pro', 'el refuerzo de preguntas falladas'), validate(generateRefuerzoSchema), generateRefuerzo);
router.post('/submit', requireAuth, submitRateLimit, validate(submitTestSchema), submitTest);
// history: carga el plan para limitar resultados en plan free
router.get('/history', requireAuth, loadUserPlan, getTestHistory);
// recomendado: sugerencia personalizada
router.get('/recomendado', requireAuth, loadUserPlan, getTestRecomendado);
router.get('/:testId/review', requireAuth, getTestReview);
router.get('/:testId/config', requireAuth, getTestConfig);

export default router;