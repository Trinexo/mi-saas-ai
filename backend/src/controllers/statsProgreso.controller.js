import { ok } from '../utils/response.js';
import { statsService } from '../services/stats.service.js';
import { ApiError } from '../utils/api-error.js';

export const getTemasDebiles = async (req, res, next) => {
  try {
    const data = await statsService.getTemasDebiles(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoTemas = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ? Number(req.query.oposicion_id) : null;
    const data = await statsService.getProgresoTemas(req.user.userId, oposicionId);
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

export const getRepasoStats = async (req, res, next) => {
  try {
    const data = await statsService.getRepasoStats(req.user.userId, req.query.tema_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getSimulacrosStats = async (req, res, next) => {
  try {
    const data = await statsService.getSimulacrosStats(req.user.userId, req.query.oposicion_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getResumenOposicion = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ? Number(req.query.oposicion_id) : null;
    if (!oposicionId) return next(new ApiError(400, 'Se requiere oposicion_id'));
    const data = await statsService.getResumenOposicion(req.user.userId, oposicionId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoMaterias = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ? Number(req.query.oposicion_id) : null;
    if (!oposicionId) return next(new ApiError(400, 'Se requiere oposicion_id'));
    const data = await statsService.getProgresoMaterias(req.user.userId, oposicionId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoTemasByMateria = async (req, res, next) => {
  try {
    const materiaId = req.query.materia_id ? Number(req.query.materia_id) : null;
    if (!materiaId) return next(new ApiError(400, 'Se requiere materia_id'));
    const data = await statsService.getProgresoTemasByMateria(req.user.userId, materiaId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getDetalleTema = async (req, res, next) => {
  try {
    const temaId = req.params.id ? Number(req.params.id) : null;
    if (!temaId) return next(new ApiError(400, 'Se requiere id de tema'));
    const data = await statsService.getDetalleTema(req.user.userId, temaId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getMisOposiciones = async (req, res, next) => {
  try {
    const data = await statsService.getMisOposiciones(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
