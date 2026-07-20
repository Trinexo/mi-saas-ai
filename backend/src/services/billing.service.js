import { billingRepository as defaultBillingRepository } from '../repositories/billing.repository.js';
import { accesoOposicionRepository as defaultAccesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { settingsService as defaultSettingsService } from './settings.service.js';
import { emailService as defaultEmailService } from './email.service.js';
import { authRepository as defaultAuthRepository } from '../repositories/auth.repository.js';
import { catalogRepository as defaultCatalogRepository } from '../repositories/catalog.repository.js';
import { getStripeClient } from '../config/stripeClient.js';
import { assertStripeTestIsolation } from '../utils/stripe-test-guards.js';
import { ApiError } from '../utils/api-error.js';

function httpError(status, message) {
  return new ApiError(status, message);
}

function parsePositiveInt(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw httpError(400, `${label} invalido`);
  }
  return parsed;
}

function getEventCreatedAt(event) {
  if (Number.isFinite(event.created)) {
    return new Date(event.created * 1000);
  }
  return new Date();
}

function assertValidPrice(oposicion) {
  const price = Number(oposicion?.precio_mensual_cents);
  if (!Number.isInteger(price) || price <= 0) {
    throw httpError(400, 'Precio de oposicion invalido');
  }
  return price;
}

export function createBillingService({
  billingRepository = defaultBillingRepository,
  accesoOposicionRepository = defaultAccesoOposicionRepository,
  settingsService = defaultSettingsService,
  emailService = defaultEmailService,
  authRepository = defaultAuthRepository,
  catalogRepository = defaultCatalogRepository,
  stripeClientProvider = getStripeClient,
  awaitEmailsForTests = false,
  afterWebhookEventRegistered = null,
} = {}) {
  async function sendAccessConfirmationEmail({ userId, oposicionId, fechaFin }) {
    const [user, oposiciones] = await Promise.all([
      authRepository.getUserById(userId),
      catalogRepository.getOposiciones(),
    ]);
    if (!user) return;
    const oposicion = oposiciones.find((item) => Number(item.id) === Number(oposicionId));
    await emailService.sendAccesoConfirmado({
      to: user.email,
      nombre: user.nombre,
      oposicionNombre: oposicion?.nombre ?? `Oposicion #${oposicionId}`,
      fechaFin,
    });
  }

  return {
    /**
     * Crea una Stripe Checkout Session para comprar acceso a una oposicion.
     * Devuelve la URL a la que redirigir al usuario.
     */
    async crearCheckoutSession({ userId, oposicionId, userEmail }) {
      const oposicion = await billingRepository.getOposicionConPrecio(oposicionId);
      if (!oposicion) {
        throw httpError(404, 'Oposicion no encontrada');
      }

      const price = assertValidPrice(oposicion);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      assertStripeTestIsolation();
      const stripe = await stripeClientProvider();

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: userEmail,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: price,
              product_data: {
                name: `Acceso a ${oposicion.nombre}`,
                description: `Acceso mensual a la oposicion ${oposicion.nombre}`,
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
     * Concede acceso 30 dias al usuario cuando el pago es exitoso.
     */
    async procesarWebhook(rawBody, signature) {
      const cfg = await settingsService.getStripeConfig();
      const webhookSecret = cfg.webhookSecret;
      if (!webhookSecret || webhookSecret.startsWith('whsec_XXXX')) {
        throw new Error('STRIPE_WEBHOOK_SECRET no configurado. Anadelo en Ajustes del panel admin.');
      }

      const stripe = await stripeClientProvider();
      let event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch {
        throw httpError(400, 'Firma del webhook invalida');
      }

      assertStripeTestIsolation({ event });

      if (event.type !== 'checkout.session.completed') {
        return { processed: false, ignored: true };
      }

      const session = event.data?.object;
      const eventId = event.id;
      const objectId = session?.id;
      if (!eventId || !objectId) {
        throw httpError(400, 'Evento Stripe invalido');
      }

      const result = await billingRepository.withTransaction(async (client) => {
        const registered = await billingRepository.registerStripeWebhookEvent(client, {
          eventId,
          eventType: event.type,
          objectId,
          livemode: event.livemode === true,
          createdAt: getEventCreatedAt(event),
        });

        if (!registered) {
          return { processed: false, duplicate: true };
        }

        if (afterWebhookEventRegistered) {
          await afterWebhookEventRegistered({ event, session, client });
        }

        const userId = parsePositiveInt(session.metadata?.userId, 'userId');
        const oposicionId = parsePositiveInt(session.metadata?.oposicionId, 'oposicionId');

        const fechaFin = new Date();
        fechaFin.setDate(fechaFin.getDate() + 30);

        await accesoOposicionRepository.crearAcceso({
          userId,
          oposicionId,
          fechaFin,
          precioPagado: session.amount_total ? session.amount_total / 100 : null,
          notas: `Stripe session ${session.id}`,
          client,
        });

        await billingRepository.registrarStripeSession(userId, oposicionId, session.id, client);
        await billingRepository.markStripeWebhookEventProcessed(client, eventId);

        return { processed: true, userId, oposicionId, fechaFin };
      });

      if (result.processed) {
        const emailPromise = sendAccessConfirmationEmail(result)
          .catch((err) => console.error('[email] Error enviando acceso confirmado:', err.message));
        if (awaitEmailsForTests) await emailPromise;
      }

      return result;
    },

    /**
     * Actualiza el precio mensual de una oposicion (uso exclusivo admin).
     */
    async setPrecio(oposicionId, precioEuros) {
      const precioCents = Math.round(precioEuros * 100);
      return billingRepository.setPrecio(oposicionId, precioCents);
    },
  };
}

export const billingService = createBillingService();
