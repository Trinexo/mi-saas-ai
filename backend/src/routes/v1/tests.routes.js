import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { rateLimit } from '../../middleware/rate-limit.middleware.js';
import { generateTestSchema, submitTestSchema } from '../../schemas/test.schema.js';
import { generateTest, submitTest } from '../../controllers/test.controller.js';

const router = Router();

const submitRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	keyBuilder: (req) => req.user?.userId || req.ip,
	message: 'Has enviado demasiados tests en poco tiempo. Espera un minuto.',
});

router.post('/generate', requireAuth, validate(generateTestSchema), generateTest);
router.post('/submit', requireAuth, submitRateLimit, validate(submitTestSchema), submitTest);

export default router;