import { ok } from '../utils/response.js';
import { statsService } from '../services/stats.service.js';

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
