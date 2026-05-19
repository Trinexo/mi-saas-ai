import { ok } from '../utils/response.js';
import { statsService } from '../services/stats.service.js';
import { ApiError } from '../utils/api-error.js';
import { rankingService } from '../services/ranking.service.js';

export const getTemasDebiles = async (req, res, next) => {
  try {
    const data = await statsService.getTemasDebiles(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoBloques = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ? Number(req.query.oposicion_id) : null;
    const data = await statsService.getProgresoBloques(req.user.userId, oposicionId);
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

export const getProgresoTemasReal = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ? Number(req.query.oposicion_id) : null;
    const data = await statsService.getProgresoTemasReal(req.user.userId, oposicionId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoTemaReal = async (req, res, next) => {
  try {
    const temaId = req.query.tema_id ? Number(req.query.tema_id) : null;
    if (!temaId) return next(new ApiError(400, 'Se requiere tema_id'));
    const data = await statsService.getProgresoTemaReal(req.user.userId, temaId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getRanking = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ? Number(req.query.oposicion_id) : null;
    const data = await rankingService.getRanking(req.user.userId, oposicionId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getBloqueStats = async (req, res, next) => {
  try {
    const data = await statsService.getBloqueStats(req.user.userId, req.query.bloque_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getRepasoStats = async (req, res, next) => {
  try {
    const data = await statsService.getRepasoStats(req.user.userId, req.query.bloque_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getDetalleBloque = async (req, res, next) => {
  try {
    const bloqueId = req.params.id ? Number(req.params.id) : null;
    if (!bloqueId) return next(new ApiError(400, 'Se requiere id de bloque'));
    const data = await statsService.getDetalleBloque(req.user.userId, bloqueId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
