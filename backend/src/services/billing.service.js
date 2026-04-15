import Stripe from 'stripe';
import { billingRepository } from '../repositories/billing.repository.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { settingsService } from './settings.service.js';
import { emailService } from './email.service.js';
import { authRepository } from '../repositories/auth.repository.js';
import { catalogRepository } from '../repositories/catalog.repository.js';

// Stripe se inicializa leyendo la clave de BD (fallback a .env)
const getStripe = async () => {
  const cfg = await settingsService.getStripeConfig();
  const key = cfg.secretKey;
  if (!key || key.startsWith('sk_test_XXXX')) {
    throw new Error('STRIPE_SECRET_KEY no está configurada. Añádela en Ajustes del panel admin.');
  }
  return new Stripe(key, { apiVersion: '2024-04-10' });
};

export const billingService = {
  /**
   * Crea una Stripe Checkout Session para comprar acceso a una oposición.
   * Devuelve la URL a la que redirigir al usuario.
   */
  async crearCheckoutSession({ userId, oposicionId, userEmail }) {
    const oposicion = await billingRepository.getOposicionConPrecio(oposicionId);
    if (!oposicion) {
      const error = new Error('Oposición no encontrada');
      error.status = 404;
      throw error;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const stripe = await getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: userEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: oposicion.precio_mensual_cents,
            product_data: {
              name: `Acceso a ${oposicion.nombre}`,
              description: `Acceso mensual a la oposición ${oposicion.nombre}`,
            },
          },
        },
      ],
      metadata: {
        userId: String(userId),
        oposicionId: String(oposicionId),
      },
      success_url: `${frontendUrl}/mis-oposiciones?pago=ok&oposicion=${oposicionId}`,
      cancel_url: `${frontendUrl}/catalogo?pago=cancelado`,
    });

    return { url: session.url, sessionId: session.id };
  },

  /**
   * Procesa el webhook de Stripe.
   * Concede acceso 30 días al usuario cuando el pago es exitoso.
   */
  async procesarWebhook(rawBody, signature) {
    const cfg = await settingsService.getStripeConfig();
    const webhookSecret = cfg.webhookSecret;
    if (!webhookSecret || webhookSecret.startsWith('whsec_XXXX')) {
      throw new Error('STRIPE_WEBHOOK_SECRET no configurado. Añádelo en Ajustes del panel admin.');
    }

    const stripe = await getStripe();
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      const err = new Error('Firma del webhook inválida');
      err.status = 400;
      throw err;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, oposicionId } = session.metadata ?? {};

      if (!userId || !oposicionId) return;

      const fechaFin = new Date();
      fechaFin.setDate(fechaFin.getDate() + 30);

      await accesoOposicionRepository.crearAcceso({
        userId: Number(userId),
        oposicionId: Number(oposicionId),
        fechaFin,
        precioPagado: session.amount_total ? session.amount_total / 100 : null,
        notas: `Stripe session ${session.id}`,
      });

      await billingRepository.registrarStripeSession(
        Number(userId),
        Number(oposicionId),
        session.id,
      );

      // Email de confirmación de acceso (fire-and-forget)
      Promise.all([
        authRepository.getUserById(Number(userId)),
        catalogRepository.getOposiciones(),
      ]).then(([user, oposiciones]) => {
        if (!user) return;
        const oposicion = oposiciones.find((o) => o.id === Number(oposicionId));
        emailService.sendAccesoConfirmado({
          to: user.email,
          nombre: user.nombre,
          oposicionNombre: oposicion?.nombre ?? `Oposición #${oposicionId}`,
          fechaFin,
        }).catch((err) => console.error('[email] Error enviando acceso confirmado:', err.message));
      }).catch(() => {});
    }
  },

  /**
   * Actualiza el precio mensual de una oposición (uso exclusivo admin).
   */
  async setPrecio(oposicionId, precioEuros) {
    const precioCents = Math.round(precioEuros * 100);
    return billingRepository.setPrecio(oposicionId, precioCents);
  },
};
