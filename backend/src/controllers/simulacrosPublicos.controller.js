import { ok, created } from '../utils/response.js';
import { simulacrosPublicosService } from '../services/simulacrosPublicos.service.js';

export const getSimulacrosPublicados = async (req, res, next) => {
  try {
    const items = await simulacrosPublicosService.getPublicados(req.user.userId);
    return ok(res, items);
  } catch (err) {
    return next(err);
  }
};

export const iniciarSimulacroPublicado = async (req, res, next) => {
  try {
    const simulacroId = Number(req.params.id);
    const data = await simulacrosPublicosService.iniciarSimulacroPublicado(req.user.userId, simulacroId);
    return created(res, data, 'Simulacro iniciado');
  } catch (err) {
    return next(err);
  }
};
