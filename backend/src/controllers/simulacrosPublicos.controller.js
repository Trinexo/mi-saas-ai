import { ok, created } from '../utils/response.js';
import { simulacrosPublicosService } from '../services/simulacrosPublicos.service.js';

export const getSimulacrosPublicados = async (req, res, next) => {
  try {
    const oposicionId = req.query.oposicion_id ?? null;
    const items = await simulacrosPublicosService.getPublicados(req.user.userId, oposicionId);
    return ok(res, items);
  } catch (err) {
    return next(err);
  }
};

export const iniciarSimulacroPublicado = async (req, res, next) => {
  try {
    const simulacroId = req.params.id;
    const data = await simulacrosPublicosService.iniciarSimulacroPublicado(req.user.userId, simulacroId);
    return created(res, data, 'Simulacro iniciado');
  } catch (err) {
    return next(err);
  }
};
