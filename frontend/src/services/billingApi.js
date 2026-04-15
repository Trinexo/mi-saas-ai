import { apiRequest } from './api';

export const billingApi = {
  /**
   * Crea una Stripe Checkout Session para comprar acceso a una oposición.
   * Devuelve { url, sessionId }
   */
  crearCheckout: (token, oposicionId) =>
    apiRequest('/billing/checkout', { method: 'POST', body: { oposicionId }, token }),
};
