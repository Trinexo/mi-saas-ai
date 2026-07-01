import { ok } from '../utils/response.js';
import { statsService } from '../services/stats.service.js';

const getModoOptions = (req) => ({
  modoPreparacion: req.query.modo_preparacion ?? 'experto',
  albacerModuloId: req.query.albacer_modulo_id ?? null,
});

export const getSimulacrosStats = async (req, res, next) => {
  try {
    const data = await statsService.getSimulacrosStats(req.user.userId, req.query.oposicion_id, {
      modoPreparacion: req.query.modo_preparacion ?? 'experto',
      albacerModuloId: req.query.albacer_modulo_id ?? null,
    });
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getResumenOposicion = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id;
    const data = await statsService.getResumenOposicion(req.user.userId, oposicionId, getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoMaterias = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id;
    const data = await statsService.getProgresoMaterias(req.user.userId, oposicionId, getModoOptions(req));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getProgresoBloquesByTema = async (req, res, next) => {
  try {
    const temaId = req.query.tema_id;
    const data = await statsService.getProgresoBloquesByTema(req.user.userId, temaId, getModoOptions(req));
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
