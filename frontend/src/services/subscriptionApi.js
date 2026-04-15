import { apiRequest } from './api';

export const subscriptionApi = {
  /**
   * Devuelve el plan activo del usuario autenticado y su historial de suscripciones.
   */
  getMyPlan: (token) => apiRequest('/subscriptions/me', { token }),

  /**
   * Admin: asigna un plan a un usuario.
   * @param {string} plan      - 'free' | 'pro' | 'elite'
   * @param {string} [fechaFin] - fecha de expiración YYYY-MM-DD (opcional)
   * @param {string} [notas]   - referencia interna (opcional)
   */
  assignPlan: (token, userId, payload) =>
    apiRequest(`/subscriptions/users/${userId}`, { method: 'POST', body: payload, token }),

  /**
   * Admin: lista todas las suscripciones.
   */
  listSuscripciones: (token, query = {}) =>
    apiRequest('/subscriptions', { token, query }),

  /**
   * Admin: estadísticas globales de suscripciones.
   */
  getStats: (token) =>
    apiRequest('/subscriptions/stats', { token }),
};
