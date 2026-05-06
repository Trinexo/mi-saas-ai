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

export const getTemas = async (req, res, next) => {
  try {
    const data = await catalogService.getTemas(req.query.oposicion_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getBloques = async (req, res, next) => {
  try {
    const data = await catalogService.getBloques(req.query.tema_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getPreguntas = async (req, res, next) => {
  try {
    const data = await catalogService.getPreguntas({
      bloqueId: req.query.bloque_id ?? req.query.tema_id,
      page: req.query.page,
      pageSize: req.query.page_size,
    });
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};