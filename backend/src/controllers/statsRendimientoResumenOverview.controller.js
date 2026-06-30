import { ok } from '../utils/response.js';
import { statsService } from '../services/stats.service.js';

const getOposicionId = (req) => (req.query.oposicion_id ? Number(req.query.oposicion_id) : null);
const getModoOptions = (req) => ({
  modoPreparacion: req.query.modo_preparacion || 'experto',
  albacerModuloId: req.query.albacer_modulo_id ? Number(req.query.albacer_modulo_id) : null,
});

export const getResumenSemana = async (req, res, next) => {
  try {
    const data = await statsService.getResumenSemana(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getFocoHoy = async (req, res, next) => {
  try {
    const data = await statsService.getFocoHoy(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getGamificacion = async (req, res, next) => {
  try {
    const data = await statsService.getGamificacion(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getObjetivoDiario = async (req, res, next) => {
  try {
    const data = await statsService.getObjetivoDiario(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getDashboard = async (req, res, next) => {
  try {
    const data = await statsService.getDashboard(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
