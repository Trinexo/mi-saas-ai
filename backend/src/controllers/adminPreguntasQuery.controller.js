import { ok } from '../utils/response.js';
import { adminService } from '../services/admin.service.js';

export const listPreguntas = async (req, res, next) => {
  try {
    const data = await adminService.listPreguntas(req.query);
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

export const listPreguntasSinRevisar = async (req, res, next) => {
  try {
    const data = await adminService.listPreguntasSinRevisar(req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getPreguntasPorEstado = async (_req, res, next) => {
  try {
    const data = await adminService.getPreguntasPorEstado();
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
