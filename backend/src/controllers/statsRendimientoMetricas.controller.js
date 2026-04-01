import { ok } from '../utils/response.js';
import { statsService } from '../services/stats.service.js';

export const getConsistenciaDiaria = async (req, res, next) => {
  try {
    const data = await statsService.getConsistenciaDiaria(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getRitmoPregunta = async (req, res, next) => {
  try {
    const data = await statsService.getRitmoPregunta(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getBalancePrecision = async (req, res, next) => {
  try {
    const data = await statsService.getBalancePrecision(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getEficienciaTiempo = async (req, res, next) => {
  try {
    const data = await statsService.getEficienciaTiempo(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoSemanal = async (req, res, next) => {
  try {
    const data = await statsService.getProgresoSemanal(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getRendimientoModos = async (req, res, next) => {
  try {
    const data = await statsService.getRendimientoModos(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getInsightMensual = async (req, res, next) => {
  try {
    const data = await statsService.getInsightMensual(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getActividad14Dias = async (req, res, next) => {
  try {
    const data = await statsService.getActividad14Dias(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
