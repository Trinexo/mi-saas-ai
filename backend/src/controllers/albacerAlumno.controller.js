import { albacerAlumnoService } from '../services/albacerAlumno.service.js';
import { created, ok } from '../utils/response.js';

export const getAlbacerEstado = async (req, res, next) => {
  try {
    const data = await albacerAlumnoService.getEstado(req.user.userId, req.query.oposicion_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const listAlbacerAlumnoModulos = async (req, res, next) => {
  try {
    const data = await albacerAlumnoService.listModulos(req.user.userId, req.query.oposicion_id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const empezarAlbacerItem = async (req, res, next) => {
  try {
    const data = await albacerAlumnoService.empezarItem(req.user.userId, req.params.itemId);
    return created(res, data, 'Actividad Albacer iniciada');
  } catch (error) {
    return next(error);
  }
};

export const empezarAlbacerSimulacroFinal = async (req, res, next) => {
  try {
    const data = await albacerAlumnoService.empezarSimulacroFinalByModulo(req.user.userId, req.params.id);
    return created(res, data, 'Simulacro final Albacer iniciado');
  } catch (error) {
    return next(error);
  }
};
