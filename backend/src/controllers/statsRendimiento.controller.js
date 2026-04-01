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

export const getResumenSemana = async (req, res, next) => {
  try {
    const data = await statsService.getResumenSemana(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getFocoHoy = async (req, res, next) => {
  try {
    const data = await statsService.getFocoHoy(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getGamificacion = async (req, res, next) => {
  try {
    const data = await statsService.getGamificacion(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getObjetivoDiario = async (req, res, next) => {
  try {
    const data = await statsService.getObjetivoDiario(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getDashboard = async (req, res, next) => {
  try {
    const data = await statsService.getDashboard(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getUserStats = async (req, res, next) => {
  try {
    const data = await statsService.getUserStats(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getEvolucion = async (req, res, next) => {
  try {
    const data = await statsService.getEvolucion(req.user.userId, req.query.limit);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getRacha = async (req, res, next) => {
  try {
    const data = await statsService.getRacha(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getRachaTemas = async (req, res, next) => {
  try {
    const data = await statsService.getRachaTemas(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
