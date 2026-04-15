import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  getSettings,
  testEmailSettings,
  updateEmailSettings,
  updateStripeSettings,
} from '../../controllers/adminSettings.controller.js';
import {
  updateEmailSettingsSchema,
  updateStripeSettingsSchema,
} from '../../schemas/adminSettings.schema.js';
import { z } from 'zod';

const router = Router();

// Solo admins
router.use(requireAuth, requireRole('admin'));

// GET  /admin/settings           → lista todos los ajustes para la UI
router.get('/', getSettings);

// PATCH /admin/settings/email    → actualiza config de email
router.patch('/email', validate(updateEmailSettingsSchema), updateEmailSettings);

// PATCH /admin/settings/stripe   → actualiza config de Stripe
router.patch('/stripe', validate(updateStripeSettingsSchema), updateStripeSettings);

// POST  /admin/settings/email/test → envía email de prueba
router.post(
  '/email/test',
  validate(z.object({ destinatario: z.string().email() })),
  testEmailSettings,
);

export default router;
