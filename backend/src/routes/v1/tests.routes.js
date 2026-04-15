import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { rateLimit } from '../../middleware/rate-limit.middleware.js';
import { loadUserPlan, requirePlan } from '../../middleware/plan.middleware.js';
import { generateTestSchema, submitTestSchema, generateRefuerzoSchema } from '../../schemas/test.schema.js';
import { generateTest, submitTest, getTestHistory, getTestReview, getTestConfig, generateRefuerzo, getTestRecomendado } from '../../controllers/test.controller.js';

const router = Router();

const submitRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	keyBuilder: (req) => req.user?.userId || req.ip,
	message: 'Has enviado demasiados tests en poco tiempo. Espera un minuto.',
});

// generate: carga el plan para aplicar límites de preguntas y modo simulacro
router.post('/generate', requireAuth, loadUserPlan, validate(generateTestSchema), generateTest);
// generate-refuerzo: requiere plan pro o superior
router.post('/generate-refuerzo', requireAuth, loadUserPlan, requirePlan('pro', 'el refuerzo de preguntas falladas'), validate(generateRefuerzoSchema), generateRefuerzo);
router.post('/submit', requireAuth, submitRateLimit, validate(submitTestSchema), submitTest);
// history: carga el plan para limitar resultados en plan free
router.get('/history', requireAuth, loadUserPlan, getTestHistory);
// recomendado: sugerencia personalizada
router.get('/recomendado', requireAuth, loadUserPlan, getTestRecomendado);
router.get('/:testId/review', requireAuth, getTestReview);
router.get('/:testId/config', requireAuth, getTestConfig);

export default router;