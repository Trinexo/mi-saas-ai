import { ok } from '../utils/response.js';
import { profesorService } from '../services/profesor.service.js';
import { adminService } from '../services/admin.service.js';

export const getProfesorDashboard = async (req, res, next) => {
  try {
    const data = await profesorService.getDashboard(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getMisOposiciones = async (req, res, next) => {
  try {
    const data = await profesorService.getMisOposiciones(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getMisPreguntas = async (req, res, next) => {
  try {
    const data = await profesorService.getMisPreguntas(req.user.userId, req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const listMisReportes = async (req, res, next) => {
  try {
    const data = await adminService.listReportes(req.query, req.user);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const updateMiReporteEstado = async (req, res, next) => {
  try {
    const data = await adminService.updateReporteEstado(
      req.params.id,
      req.body.estado,
      req.body.mensajeAdmin,
      req.user,
    );
    return ok(res, data, 'Reporte actualizado');
  } catch (error) {
    return next(error);
  }
};
