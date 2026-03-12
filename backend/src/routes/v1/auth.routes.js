import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { rateLimit } from '../../middleware/rate-limit.middleware.js';
import { loginSchema, registerSchema } from '../../schemas/auth.schema.js';
import { login, register } from '../../controllers/auth.controller.js';

const router = Router();

const authRateLimit = rateLimit({
	windowMs: 60 * 1000,
	max: 15,
	message: 'Demasiados intentos de autenticación. Espera un minuto.',
});

router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login', authRateLimit, validate(loginSchema), login);

export default router;