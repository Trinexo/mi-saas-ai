import { ok } from '../utils/response.js';
import { statsService } from '../services/stats.service.js';

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
