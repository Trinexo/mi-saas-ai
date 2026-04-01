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

export const getTemasConMasErrores = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const data = await adminService.getTemasConMasErrores(limit);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
