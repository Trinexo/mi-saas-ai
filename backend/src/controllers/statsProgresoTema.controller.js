import { ok } from '../utils/response.js';
import { statsService } from '../services/stats.service.js';
import { ApiError } from '../utils/api-error.js';

export const getTemasDebiles = async (req, res, next) => {
  try {
    const data = await statsService.getTemasDebiles(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoTemas = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ? Number(req.query.oposicion_id) : null;
    const data = await statsService.getProgresoTemas(req.user.userId, oposicionId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getTemaStats = async (req, res, next) => {
  try {
    const data = await statsService.getTemaStats(req.user.userId, req.query.tema_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getRepasoStats = async (req, res, next) => {
  try {
    const data = await statsService.getRepasoStats(req.user.userId, req.query.tema_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getDetalleTema = async (req, res, next) => {
  try {
    const temaId = req.params.id ? Number(req.params.id) : null;
    if (!temaId) return next(new ApiError(400, 'Se requiere id de tema'));
    const data = await statsService.getDetalleTema(req.user.userId, temaId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
