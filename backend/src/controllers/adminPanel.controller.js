import { ok } from '../utils/response.js';
import { adminService } from '../services/admin.service.js';

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
    const data = await adminService.updateReporteEstado(req.params.id, req.body.estado, req.body.mensajeAdmin);
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

export const listUsers = async (req, res, next) => {
  try {
    const data = await adminService.listUsers(req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const data = await adminService.updateUserRole(req.params.id, req.body.role, req.user);
    return ok(res, data, 'Rol actualizado');
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const data = await adminService.deleteUser(req.params.id, req.user);
    return ok(res, data, 'Usuario eliminado');
  } catch (error) {
    return next(error);
  }
};

export const bulkUsers = async (req, res, next) => {
  try {
    const { ids, action, value } = req.body;
    const data = await adminService.bulkUsers({ ids, action, value, requestingUser: req.user });
    return ok(res, data, `Acción masiva completada`);
  } catch (error) {
    return next(error);
  }
};

export const getTemasConMasErrores = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const data = await adminService.getTemasConMasErrores(limit);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const listProfesorAsignaciones = async (req, res, next) => {
  try {
    const data = await adminService.listAsignaciones(req.query.email);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const assignProfesorOposicion = async (req, res, next) => {
  try {
    const data = await adminService.assignOposicion(req.body.email, req.body.oposicionId);
    return ok(res, data, 'Oposición asignada al profesor');
  } catch (error) {
    return next(error);
  }
};

export const removeProfesorOposicion = async (req, res, next) => {
  try {
    const data = await adminService.removeOposicion(req.body.email, req.body.oposicionId);
    return ok(res, data, 'Asignación eliminada');
  } catch (error) {
    return next(error);
  }
};

export const listProfesores = async (req, res, next) => {
  try {
    const data = await adminService.listProfesores(req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const createProfesor = async (req, res, next) => {
  try {
    const data = await adminService.createProfesor(req.body);
    return ok(res, data, 'Profesor creado correctamente');
  } catch (error) {
    return next(error);
  }
};

export const updateProfesor = async (req, res, next) => {
  try {
    const data = await adminService.updateProfesor(req.params.id, req.body);
    return ok(res, data, 'Profesor actualizado correctamente');
  } catch (error) {
    return next(error);
  }
};

export const deleteProfesor = async (req, res, next) => {
  try {
    const data = await adminService.deleteProfesor(req.params.id, req.user);
    return ok(res, data, 'Profesor eliminado');
  } catch (error) {
    return next(error);
  }
};
