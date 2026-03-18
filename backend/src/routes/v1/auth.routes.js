import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { rateLimit } from '../../middleware/rate-limit.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { loginSchema, registerSchema, updateProfileSchema, updatePasswordSchema } from '../../schemas/auth.schema.js';
import { login, register, getMe, updateProfile, updatePassword } from '../../controllers/auth.controller.js';

const router = Router();

const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Demasiados intentos de autenticacion. Espera un minuto.',
});

router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login', authRateLimit, validate(loginSchema), login);
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, validate(updateProfileSchema), updateProfile);
router.put('/password', requireAuth, validate(updatePasswordSchema), updatePassword);

export default router;
