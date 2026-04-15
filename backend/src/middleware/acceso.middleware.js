import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Middleware: carga los IDs de oposiciones accesibles para el usuario en req.user.oposicionesAccesibles.
 * Se usa para lógica que necesita conocer todos los accesos (ej: estadísticas).
 * Requiere requireAuth ejecutado antes.
 */
export const loadUserAccesos = async (req, res, next) => {
  try {
    const accesos = await accesoOposicionRepository.getAccesosActivos(req.user.userId);
    req.user.oposicionesAccesibles = accesos.map((a) => a.oposicion_id);
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Middleware factory: bloquea el acceso si el usuario no tiene acceso a la oposición solicitada.
 * Obtiene el oposicionId de:
 *   1. req.body.oposicionId
 *   2. req.query.oposicion_id
 *   3. req.params.oposicionId
 *
 * Si el usuario no tiene acceso a NINGUNA oposición solo puede usar preguntas de demo (plan free).
 * Esta validación se aplicará TRAS loadUserPlan para que ambos contextos estén disponibles.
 *
 * @param {'strict'|'demo'} mode
 *   'strict' → exige acceso explícito a la oposición (para contenido completo)
 *   'demo'   → permite paso libre si no se especifica oposición (fallback a muestra)
 */
export const requireAccesoOposicion = (mode = 'strict') => async (req, res, next) => {
  try {
    const rawId = req.body?.oposicionId ?? req.query?.oposicion_id ?? req.params?.oposicionId;
    if (!rawId) {
      // Sin oposición concreta: modo demo permitido siempre
      return next();
    }
    const oposicionId = Number(rawId);
    const tiene = await accesoOposicionRepository.tieneAcceso(req.user.userId, oposicionId);
    if (!tiene) {
      if (mode === 'demo') {
        // Marca como demo, el servicio limitará las preguntas
        req.user.modoDemo = true;
        return next();
      }
      return next(
        new ApiError(
          403,
          'No tienes acceso al curso de esta oposición. Puedes adquirirlo desde el catálogo.',
          { code: 'ACCESO_OPOSICION_REQUERIDO', oposicionId },
        ),
      );
    }
    req.user.oposicionId = oposicionId;
    return next();
  } catch (error) {
    return next(error);
  }
};
