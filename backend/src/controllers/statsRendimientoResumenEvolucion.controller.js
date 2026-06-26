import { ok } from '../utils/response.js';
import { statsService } from '../services/stats.service.js';

const getOposicionId = (req) => (req.query.oposicion_id ? Number(req.query.oposicion_id) : null);
const getModoOptions = (req) => ({
  modoPreparacion: req.query.modo_preparacion || 'experto',
  albacerModuloId: req.query.albacer_modulo_id ? Number(req.query.albacer_modulo_id) : null,
});

export const getUserStats = async (req, res, next) => {
  try {
    const data = await statsService.getUserStats(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getEvolucion = async (req, res, next) => {
  try {
    const data = await statsService.getEvolucion(req.user.userId, req.query.limit, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getRacha = async (req, res, next) => {
  try {
    const data = await statsService.getRacha(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getRachaBloques = async (req, res, next) => {
  try {
    const data = await statsService.getRachaBloques(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
