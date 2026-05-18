import { ok } from '../utils/response.js';
import { planEstudioService } from '../services/planEstudio.service.js';

export const listPlanEstudio = async (req, res, next) => {
  try {
    const data = await planEstudioService.list(req.user.userId, req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const empezarPlanEstudio = async (req, res, next) => {
  try {
    const data = await planEstudioService.empezar(req.user.userId, Number(req.params.id));
    return ok(res, data, 'Actividad iniciada');
  } catch (error) {
    return next(error);
  }
};
