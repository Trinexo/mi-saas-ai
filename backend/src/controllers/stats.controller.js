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

export const getTemaStats = async (req, res, next) => {
  try {
    const data = await statsService.getTemaStats(req.user.userId, req.query.tema_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};