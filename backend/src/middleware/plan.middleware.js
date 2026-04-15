import { subscriptionRepository } from '../repositories/subscription.repository.js';
import { planHasAccess } from '../config/plans.config.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Middleware: carga el plan activo del usuario en req.user.plan.
 * Requiere que requireAuth haya sido ejecutado antes.
 * Si el usuario no tiene suscripción activa, asigna 'free' por defecto.
 */
export const loadUserPlan = async (req, res, next) => {
  try {
    req.user.plan = await subscriptionRepository.getActivePlan(req.user.userId);
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Middleware factory: bloquea el acceso si el plan del usuario es inferior al requerido.
 * Debe usarse DESPUÉS de loadUserPlan.
 *
 * @param {string} minPlan - Plan mínimo requerido ('pro' | 'elite')
 * @param {string} [feature] - Descripción de la funcionalidad bloqueada (para el mensaje)
 */
export const requirePlan = (minPlan, feature = 'esta funcionalidad') => (req, res, next) => {
  const userPlan = req.user?.plan ?? 'free';
  if (!planHasAccess(userPlan, minPlan)) {
    return next(
      new ApiError(
        403,
        `Tu plan actual (${userPlan}) no incluye acceso a ${feature}. Actualiza a ${minPlan} o superior.`,
      ),
    );
  }
  return next();
};
