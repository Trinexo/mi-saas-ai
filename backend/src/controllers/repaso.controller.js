import { ok } from '../utils/response.js';
import { repasoService } from '../services/repaso.service.js';

export const getRepasoPendientes = async (req, res, next) => {
  try {
    const data = await repasoService.getPendientes(req.user.userId, req.query.limit);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
