import { ok } from '../utils/response.js';
import { profesorService } from '../services/profesor.service.js';

export const getProfesorDashboard = async (req, res, next) => {
  try {
    const data = await profesorService.getDashboard(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getMisOposiciones = async (req, res, next) => {
  try {
    const data = await profesorService.getMisOposiciones(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getMisPreguntas = async (req, res, next) => {
  try {
    const data = await profesorService.getMisPreguntas(req.user.userId, req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
