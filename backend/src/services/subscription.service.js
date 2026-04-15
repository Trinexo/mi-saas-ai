import { subscriptionRepository } from '../repositories/subscription.repository.js';
import { ApiError } from '../utils/api-error.js';
import { PLAN_ORDER } from '../config/plans.config.js';
import { emailService } from './email.service.js';
import { authRepository } from '../repositories/auth.repository.js';

export const subscriptionService = {
  /**
   * Devuelve el plan activo del usuario.
   */
  async getPlanForUser(userId) {
    return subscriptionRepository.getActivePlan(userId);
  },

  /**
   * Devuelve el historial de suscripciones del usuario.
   */
  async getHistoryForUser(userId) {
    const plan = await subscriptionRepository.getActivePlan(userId);
    const history = await subscriptionRepository.getHistory(userId);
    return { planActual: plan, historial: history };
  },

  /**
   * Admin: asigna un plan a un usuario.
   * Cancela la suscripción activa previa y crea una nueva.
   * @param {number}  targetUserId - usuario que recibe el plan
   * @param {string}  plan         - 'free' | 'pro' | 'elite'
   * @param {string}  [fechaFin]   - ISO date string opcional (ej. '2025-12-31')
   * @param {string}  [notas]      - referencia interna opcional
   */
  async assignPlan({ targetUserId, plan, fechaFin, notas }) {
    if (!PLAN_ORDER.includes(plan)) {
      throw new ApiError(400, `Plan inválido. Valores permitidos: ${PLAN_ORDER.join(', ')}`);
    }

    const fechaFinDate = fechaFin ? new Date(fechaFin) : null;
    if (fechaFinDate && isNaN(fechaFinDate.getTime())) {
      throw new ApiError(400, 'Formato de fecha_fin inválido');
    }

    // Cancelar suscripción activa anterior
    await subscriptionRepository.cancelActive(targetUserId);

    if (plan === 'free') {
      // Downgrade a free equivale a cancelar sin crear nueva suscripción
      return { plan: 'free', estado: 'sin suscripción activa' };
    }

    const suscripcion = await subscriptionRepository.create({
      userId: targetUserId,
      plan,
      fechaFin: fechaFinDate,
      notas,
    });

    // Email de confirmación del plan (fire-and-forget)
    authRepository.getUserById(targetUserId).then((user) => {
      if (!user) return;
      emailService.sendSuscripcionConfirmada({
        to: user.email,
        nombre: user.nombre,
        plan,
        fechaFin: fechaFinDate,
      }).catch((err) => console.error('[email] Error enviando confirmación plan:', err.message));
    }).catch(() => {});

    return suscripcion;
  },
};
