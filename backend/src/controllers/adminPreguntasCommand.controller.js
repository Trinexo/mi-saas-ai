import { created, ok } from '../utils/response.js';
import { adminService } from '../services/admin.service.js';

export const createPregunta = async (req, res, next) => {
  try {
    const data = await adminService.createPregunta(req.body, req.user.id, req.user.role);
    return created(res, data, 'Pregunta creada');
  } catch (error) {
    return next(error);
  }
};

export const updatePregunta = async (req, res, next) => {
  try {
    const data = await adminService.updatePregunta(req.params.id, req.body, req.user.id, req.user.role);
    return ok(res, data, 'Pregunta actualizada');
  } catch (error) {
    return next(error);
  }
};

export const deletePregunta = async (req, res, next) => {
  try {
    const data = await adminService.deletePregunta(req.params.id, req.user.id, req.user.role);
    return ok(res, data, 'Pregunta eliminada');
  } catch (error) {
    return next(error);
  }
};

export const importPreguntasCsv = async (req, res, next) => {
  try {
    const data = await adminService.importPreguntasCsv(req.body);
    return ok(res, data, 'Importación procesada');
  } catch (error) {
    return next(error);
  }
};

export const updatePreguntaEstado = async (req, res, next) => {
  try {
    const data = await adminService.updatePreguntaEstado(req.params.id, req.body.estado, req.user);
    return ok(res, data, 'Estado de pregunta actualizado');
  } catch (error) {
    return next(error);
  }
};
