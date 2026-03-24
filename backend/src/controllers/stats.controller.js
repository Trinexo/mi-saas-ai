import { ok } from '../utils/response.js';
import { statsService } from '../services/stats.service.js';
import { ApiError } from '../utils/api-error.js';

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

export const getSimulacrosStats = async (req, res, next) => {
  try {
    const data = await statsService.getSimulacrosStats(req.user.userId, req.query.oposicion_id);
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

export const getResumenOposicion = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ? Number(req.query.oposicion_id) : null;
    if (!oposicionId) return next(new ApiError(400, 'Se requiere oposicion_id'));
    const data = await statsService.getResumenOposicion(req.user.userId, oposicionId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoMaterias = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ? Number(req.query.oposicion_id) : null;
    if (!oposicionId) return next(new ApiError(400, 'Se requiere oposicion_id'));
    const data = await statsService.getProgresoMaterias(req.user.userId, oposicionId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};