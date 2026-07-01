import { ok } from '../utils/response.js';
import { statsService } from '../services/stats.service.js';

const getOposicionId = (req) => req.query.oposicion_id ?? null;
const getModoOptions = (req) => ({
  modoPreparacion: req.query.modo_preparacion ?? 'experto',
  albacerModuloId: req.query.albacer_modulo_id ?? null,
});

export const getConsistenciaDiaria = async (req, res, next) => {
  try {
    const data = await statsService.getConsistenciaDiaria(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getRitmoPregunta = async (req, res, next) => {
  try {
    const data = await statsService.getRitmoPregunta(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getBalancePrecision = async (req, res, next) => {
  try {
    const data = await statsService.getBalancePrecision(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getEficienciaTiempo = async (req, res, next) => {
  try {
    const data = await statsService.getEficienciaTiempo(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoSemanal = async (req, res, next) => {
  try {
    const data = await statsService.getProgresoSemanal(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getInsightMensual = async (req, res, next) => {
  try {
    const data = await statsService.getInsightMensual(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getActividad14Dias = async (req, res, next) => {
  try {
    const data = await statsService.getActividad14Dias(req.user.userId, getOposicionId(req), getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
