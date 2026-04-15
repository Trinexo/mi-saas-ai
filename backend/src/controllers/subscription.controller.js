import { ok } from '../utils/response.js';
import { subscriptionService } from '../services/subscription.service.js';
import { subscriptionRepository } from '../repositories/subscription.repository.js';

/**
 * GET /subscriptions/me
 * Devuelve el plan activo del usuario autenticado.
 */
export const getMyPlan = async (req, res, next) => {
  try {
    const data = await subscriptionService.getHistoryForUser(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /admin/subscriptions/users/:userId
 * Admin: asigna un plan a un usuario.
 */
export const assignPlan = async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.userId);
    const { plan, fecha_fin, notas } = req.body;
    const data = await subscriptionService.assignPlan({
      targetUserId,
      plan,
      fechaFin: fecha_fin,
      notas,
    });
    return ok(res, data, `Plan ${plan} asignado correctamente`);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /subscriptions/stats
 * Admin: estadísticas globales de suscripciones.
 */
export const getSubscriptionStats = async (req, res, next) => {
  try {
    const data = await subscriptionRepository.getStats();
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /admin/subscriptions
 * Admin: lista todas las suscripciones con filtros opcionales.
 */
export const listSuscripciones = async (req, res, next) => {
  try {
    const { plan, estado, limit, offset } = req.query;
    const data = await subscriptionRepository.listAll({
      plan,
      estado,
      limit: Number(limit ?? 50),
      offset: Number(offset ?? 0),
    });
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
