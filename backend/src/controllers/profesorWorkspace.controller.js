import { ok, created } from '../utils/response.js';
import { profesorWorkspaceAnalyticsService } from '../services/profesorWorkspaceAnalytics.service.js';
import { profesorWorkspacePlanificacionService } from '../services/profesorWorkspacePlanificacion.service.js';
import { profesorWorkspaceSeleccionService } from '../services/profesorWorkspaceSeleccion.service.js';

export const getWorkspaceDashboard = async (req, res, next) => {
  try {
    const data = await profesorWorkspaceAnalyticsService.dashboard(req.user.userId, req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const listWorkspaceOposiciones = async (req, res, next) => {
  try {
    const data = await profesorWorkspaceAnalyticsService.oposiciones(req.user.userId);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getWorkspaceOposicion = async (req, res, next) => {
  try {
    const data = await profesorWorkspaceAnalyticsService.oposicionDetalle(req.user.userId, req.params.slug);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getWorkspaceTemario = async (req, res, next) => {
  try {
    const data = await profesorWorkspaceAnalyticsService.temario(req.user.userId, req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getWorkspaceTema = async (req, res, next) => {
  try {
    const data = await profesorWorkspaceAnalyticsService.temaDetalle(req.user.userId, Number(req.params.id));
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const listWorkspaceAlumnos = async (req, res, next) => {
  try {
    const data = await profesorWorkspaceAnalyticsService.alumnos(req.user.userId, req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getWorkspaceAlumno = async (req, res, next) => {
  try {
    const data = await profesorWorkspaceAnalyticsService.alumnoDetalle(req.user.userId, req.params.id, req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getWorkspaceEstadisticas = async (req, res, next) => {
  try {
    const data = await profesorWorkspaceAnalyticsService.estadisticas(req.user.userId, req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const getWorkspaceActividadFeed = async (req, res, next) => {
  try {
    const data = await profesorWorkspaceAnalyticsService.actividadFeed(req.user.userId, req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const listPreguntasProblematicas = async (req, res, next) => {
  try {
    const data = await profesorWorkspaceAnalyticsService.preguntasProblematicas(req.user.userId, req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const listPlanificacion = async (req, res, next) => {
  try {
    const data = await profesorWorkspacePlanificacionService.list(req.user.userId, req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const listPlanificacionResultados = async (req, res, next) => {
  try {
    const data = await profesorWorkspacePlanificacionService.resultados(req.user.userId, req.params.id, req.query);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};

export const recordarPlanificacionPendientes = async (req, res, next) => {
  try {
    const data = await profesorWorkspacePlanificacionService.enviarRecordatorio(req.user.userId, req.params.id);
    return ok(res, data, data.mensaje);
  } catch (error) {
    return next(error);
  }
};

export const createPlanificacion = async (req, res, next) => {
  try {
    const data = await profesorWorkspacePlanificacionService.create(req.user.userId, req.body, req.user.role);
    return created(res, data, 'Planificacion creada');
  } catch (error) {
    return next(error);
  }
};

export const updatePlanificacion = async (req, res, next) => {
  try {
    const data = await profesorWorkspacePlanificacionService.update(req.user.userId, req.params.id, req.body);
    return ok(res, data, 'Planificacion actualizada');
  } catch (error) {
    return next(error);
  }
};

export const archivePlanificacion = async (req, res, next) => {
  try {
    const data = await profesorWorkspacePlanificacionService.archive(req.user.userId, req.params.id);
    return ok(res, data, 'Planificacion archivada');
  } catch (error) {
    return next(error);
  }
};

export const seleccionarPreguntas = async (req, res, next) => {
  try {
    const data = await profesorWorkspaceSeleccionService.seleccionar(req.user.userId, req.body);
    return ok(res, data);
  } catch (error) {
    return next(error);
  }
};
