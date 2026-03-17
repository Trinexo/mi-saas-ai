import { ok } from '../utils/response.js';
import { marcadasService } from '../services/marcadas.service.js';

export const marcarPregunta = async (req, res, next) => {
  try {
    const data = await marcadasService.marcar(req.user.userId, Number(req.params.preguntaId));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const desmarcarPregunta = async (req, res, next) => {
  try {
    const data = await marcadasService.desmarcar(req.user.userId, Number(req.params.preguntaId));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getMarcadas = async (req, res, next) => {
  try {
    const data = await marcadasService.getMarcadas(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
