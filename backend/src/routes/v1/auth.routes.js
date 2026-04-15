import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { rateLimit } from '../../middleware/rate-limit.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  loginSchema, registerSchema, updateProfileSchema,
  updatePasswordSchema, patchOposicionPreferidaSchema,
  forgotPasswordSchema, resetPasswordSchema,
} from '../../schemas/auth.schema.js';
import {
  login, register, getMe, updateProfile, updatePassword,
  patchOposicionPreferida, forgotPassword, resetPassword,
} from '../../controllers/auth.controller.js';

const router = Router();

const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Demasiados intentos de autenticacion. Espera un minuto.',
});

// Rate limit más estricto para recuperación de contraseña (5 intentos/min)
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Demasiadas solicitudes de recuperación. Espera un minuto.',
});

router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login', authRateLimit, validate(loginSchema), login);
router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, validate(updateProfileSchema), updateProfile);
router.put('/password', requireAuth, validate(updatePasswordSchema), updatePassword);
router.patch('/me/oposicion-preferida', requireAuth, validate(patchOposicionPreferidaSchema), patchOposicionPreferida);

// Recuperación de contraseña (pública)
router.post('/forgot-password', passwordResetRateLimit, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', passwordResetRateLimit, validate(resetPasswordSchema), resetPassword);

export default router;
