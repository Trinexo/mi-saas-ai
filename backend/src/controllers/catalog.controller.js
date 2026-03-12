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
    const oposicionId = Number(req.query.oposicion_id);
    const data = await catalogService.getMaterias(oposicionId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getTemas = async (req, res, next) => {
  try {
    const materiaId = Number(req.query.materia_id);
    const data = await catalogService.getTemas(materiaId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getPreguntas = async (req, res, next) => {
  try {
    const temaId = Number(req.query.tema_id);
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.page_size || 20);
    const data = await catalogService.getPreguntas({ temaId, page, pageSize });
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};