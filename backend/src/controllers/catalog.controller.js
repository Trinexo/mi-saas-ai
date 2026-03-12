import { ok } from '../utils/response.js';
import { catalogService } from '../services/catalog.service.js';

export const getOposiciones = async (req, res, next) => {
  try {
    const data = await catalogService.getOposiciones();
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getMaterias = async (req, res, next) => {
  try {
    const data = await catalogService.getMaterias(req.query.oposicion_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getTemas = async (req, res, next) => {
  try {
    const data = await catalogService.getTemas(req.query.materia_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getPreguntas = async (req, res, next) => {
  try {
    const data = await catalogService.getPreguntas({
      temaId: req.query.tema_id,
      page: req.query.page,
      pageSize: req.query.page_size,
    });
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};