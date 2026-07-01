import { ok } from '../utils/response.js';
import { statsService } from '../services/stats.service.js';
import { rankingService } from '../services/ranking.service.js';

const getModoOptions = (req) => ({
  modoPreparacion: req.query.modo_preparacion ?? 'experto',
  albacerModuloId: req.query.albacer_modulo_id ?? null,
});

export const getTemasDebiles = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ?? null;
    const data = await statsService.getTemasDebiles(req.user.userId, oposicionId, getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoBloques = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ?? null;
    const data = await statsService.getProgresoBloques(req.user.userId, oposicionId, getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoTemas = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ?? null;
    const data = await statsService.getProgresoTemas(req.user.userId, oposicionId, getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoTemasReal = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ?? null;
    const data = await statsService.getProgresoTemasReal(req.user.userId, oposicionId, getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoTemaReal = async (req, res, next) => {
  try {
    const temaId = req.query.tema_id;
    const data = await statsService.getProgresoTemaReal(req.user.userId, temaId, getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getRanking = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ?? null;
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
    const bloqueId = req.params.id;
    const data = await statsService.getDetalleBloque(req.user.userId, bloqueId, getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
