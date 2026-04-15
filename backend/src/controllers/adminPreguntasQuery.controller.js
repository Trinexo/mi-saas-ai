import { ok } from '../utils/response.js';
import { adminService } from '../services/admin.service.js';

export const listPreguntas = async (req, res, next) => {
  try {
    const data = await adminService.listPreguntas(req.query, { userId: req.user.id, role: req.user.role });
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getPregunta = async (req, res, next) => {
  try {
    const data = await adminService.getPregunta(req.params.id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
