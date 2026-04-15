import { ok } from '../utils/response.js';
import { repasoService } from '../services/repaso.service.js';

export const getRepasoPendientes = async (req, res, next) => {
  try {
    const data = await repasoService.getPendientes(req.user.userId, req.query.limit);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const postActualizarRepaso = async (req, res, next) => {
  try {
    const { respuestas } = req.body;
    await repasoService.actualizarBatch(req.user.userId, respuestas);
    return ok(res, { updated: respuestas.length });
  } catch (error) {
    return next(error);
  }
};
