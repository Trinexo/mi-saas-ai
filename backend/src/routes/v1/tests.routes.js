import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { rateLimit } from '../../middleware/rate-limit.middleware.js';
import { loadUserPlan, requirePlan } from '../../middleware/plan.middleware.js';
import { requireAccesoOposicion } from '../../middleware/acceso.middleware.js';
import {
  generateTestSchema,
  submitTestSchema,
  generateRefuerzoSchema,
  historyQuerySchema,
  testIdParamsSchema,
  testOposicionQuerySchema,
  testPendientesQuerySchema,
  reviewParamsSchema,
} from '../../schemas/test.schema.js';
import { generateTest, submitTest, getTestHistory, getTestReview, getTestConfig, generateRefuerzo, generateDemo, getTestRecomendado, getTestContinuar, getTestPendientes, cerrarTest } from '../../controllers/test.controller.js';

const router = Router();

const submitRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	keyBuilder: (req) => req.user?.userId || req.ip,
	message: 'Has enviado demasiados tests en poco tiempo. Espera un minuto.',
});

// generate: valida acceso a la oposición (modo demo si no la tiene) + límites de plan
router.post('/generate', requireAuth, loadUserPlan, requireAccesoOposicion('demo'), validate(generateTestSchema), generateTest);
// generate-demo: genera el test demo fijo (test configurado por profesor o 10 primeras del Tema 1)
router.post('/generate-demo', requireAuth, generateDemo);
// generate-refuerzo: requiere plan pro o superior + acceso a la oposición del tema
router.post('/generate-refuerzo', requireAuth, loadUserPlan, requirePlan('pro', 'el refuerzo de preguntas falladas'), validate(generateRefuerzoSchema), generateRefuerzo);
router.post('/submit', requireAuth, submitRateLimit, validate(submitTestSchema), submitTest);
// history: carga el plan para limitar resultados en plan free
router.get('/history', requireAuth, loadUserPlan, validate(historyQuerySchema, 'query'), getTestHistory);
// recomendado: sugerencia personalizada
router.get('/recomendado', requireAuth, loadUserPlan, validate(testOposicionQuerySchema, 'query'), getTestRecomendado);
// continuar: lógica inteligente de qué hacer a continuación
router.get('/continuar', requireAuth, validate(testOposicionQuerySchema, 'query'), getTestContinuar);
// pendientes: tests generados con al menos 1 respuesta (sin finalizar)
router.get('/pendientes', requireAuth, validate(testPendientesQuerySchema, 'query'), getTestPendientes);
router.post('/:testId/cerrar', requireAuth, validate(testIdParamsSchema, 'params'), cerrarTest);
router.get('/:testId/review', requireAuth, validate(reviewParamsSchema, 'params'), getTestReview);
router.get('/:testId/config', requireAuth, validate(reviewParamsSchema, 'params'), getTestConfig);

export default router;
