import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { checkoutSessionBodySchema, patchPrecioBodySchema } from '../../schemas/billing.schema.js';
import {
  postCheckoutSession,
  postWebhook,
  patchPrecioOposicion,
} from '../../controllers/billing.controller.js';

const router = Router();

/**
 * POST /billing/checkout
 * Crea una Stripe Checkout Session para comprar acceso a una oposición.
 * Requiere usuario autenticado.
 */
router.post(
  '/checkout',
  requireAuth,
  validate(checkoutSessionBodySchema, 'body'),
  postCheckoutSession,
);

/**
 * POST /billing/webhook
 * Endpoint de Stripe para notificaciones de pago.
 * No requiere auth — la verificación es con la firma de Stripe.
 */
router.post('/webhook', postWebhook);

/**
 * PATCH /billing/oposiciones/:oposicionId/precio
 * Actualiza el precio mensual de una oposición. Solo admin.
 */
router.patch(
  '/oposiciones/:oposicionId/precio',
  requireAuth,
  requireRole('admin'),
  validate(patchPrecioBodySchema, 'body'),
  patchPrecioOposicion,
);

export default router;
