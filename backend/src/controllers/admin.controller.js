import { created, ok } from '../utils/response.js';
import { adminService } from '../services/admin.service.js';

export const listPreguntas = async (req, res, next) => {
  try {
    const data = await adminService.listPreguntas(req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getPregunta = async (req, res, next) => {
  try {
    const data = await adminService.getPregunta(req.params.id);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

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

export const listReportes = async (req, res, next) => {
  try {
    const data = await adminService.listReportes(req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const updateReporteEstado = async (req, res, next) => {
  try {
    const data = await adminService.updateReporteEstado(req.params.id, req.body.estado);
    return ok(res, data, 'Reporte actualizado');
  } catch (error) {
    return next(error);
  }
};

export const listAuditoria = async (req, res, next) => {
  try {
    const data = await adminService.listAuditoria(req.query, { userId: req.user.id, role: req.user.role });
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getAdminStats = async (req, res, next) => {
  try {
    const data = await adminService.getAdminStats();
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};