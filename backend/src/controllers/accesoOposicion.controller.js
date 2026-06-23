import { ok, created } from '../utils/response.js';
import { accesoOposicionService } from '../services/accesoOposicion.service.js';
import { ApiError } from '../utils/api-error.js';

/**
 * GET /accesos/mis-oposiciones
 * Devuelve los accesos activos del usuario autenticado.
 */
export const getMisAccesos = async (req, res, next) => {
  try {
    const accesos = await accesoOposicionService.getMisAccesos(req.user.userId);
    return ok(res, accesos, 'Accesos activos');
  } catch (e) {
    return next(e);
  }
};

/**
 * GET /accesos/check/:oposicionId
 * Comprueba si el usuario tiene acceso a una oposición concreta.
 */
export const checkAcceso = async (req, res, next) => {
  try {
    const oposicionId = Number(req.params.oposicionId);
    const tiene = await accesoOposicionService.tieneAcceso(req.user.userId, oposicionId);
    return ok(res, { tieneAcceso: tiene, oposicionId });
  } catch (e) {
    return next(e);
  }
};

/**
 * GET /accesos/oposicion/:oposicionId/preparacion
 * Devuelve el modo activo y tipo de alumno del acceso del usuario.
 */
export const getPreparacionAcceso = async (req, res, next) => {
  try {
    const oposicionId = Number(req.params.oposicionId);
    if (!Number.isInteger(oposicionId) || oposicionId <= 0) {
      return next(new ApiError(400, 'oposicionId invalido'));
    }
    const acceso = await accesoOposicionService.getPreparacion(req.user.userId, oposicionId);
    return ok(res, acceso, 'Preparacion de oposicion');
  } catch (e) {
    return next(e);
  }
};

/**
 * PATCH /accesos/oposicion/:oposicionId/preparacion
 * Cambia el modo activo del alumno para una oposicion.
 */
export const updatePreparacionAcceso = async (req, res, next) => {
  try {
    const oposicionId = Number(req.params.oposicionId);
    if (!Number.isInteger(oposicionId) || oposicionId <= 0) {
      return next(new ApiError(400, 'oposicionId invalido'));
    }
    const { modoPreparacion, modo_preparacion } = req.body ?? {};
    const modo = modoPreparacion ?? modo_preparacion;
    if (!modo) return next(new ApiError(400, 'modoPreparacion es requerido'));

    const acceso = await accesoOposicionService.updateModoPreparacion(req.user.userId, oposicionId, modo);
    return ok(res, acceso, 'Modo de preparacion actualizado');
  } catch (e) {
    return next(e);
  }
};

/**
 * GET /accesos (admin)
 * Lista todos los accesos con filtros opcionales.
 */
export const listAccesos = async (req, res, next) => {
  try {
    const { page = 1, page_size = 20, email, oposicion_id } = req.query;
    const result = await accesoOposicionService.listAll({
      page: Number(page),
      pageSize: Number(page_size),
      email: email ? String(email).trim() : null,
      oposicionId: oposicion_id ? Number(oposicion_id) : null,
    });
    return ok(res, result, 'Listado de accesos');
  } catch (e) {
    return next(e);
  }
};

/**
 * POST /accesos/asignar (admin)
 * Asigna acceso a una oposición para un usuario identificado por email.
 * Body: { email, oposicionId, fechaFin?, precioPagado?, notas? }
 */
export const asignarAcceso = async (req, res, next) => {
  try {
    const {
      email,
      oposicionId,
      fechaFin = null,
      precioPagado = null,
      notas = null,
      tipoAlumno = 'libre',
      modoPreparacion = 'albacer',
    } = req.body;
    if (!email)       return next(new ApiError(400, 'email es requerido'));
    if (!oposicionId) return next(new ApiError(400, 'oposicionId es requerido'));
    const usuario = await accesoOposicionService.getUserByEmail(email.trim());
    if (!usuario) return next(new ApiError(404, `No existe ningún usuario con el email: ${email}`));
    const acceso = await accesoOposicionService.asignarAcceso({
      userId: usuario.id,
      oposicionId: Number(oposicionId),
      fechaFin,
      precioPagado,
      notas,
      tipoAlumno,
      modoPreparacion,
    });
    return created(res, { ...acceso, usuario_nombre: usuario.nombre, usuario_email: usuario.email }, 'Acceso asignado');
  } catch (e) {
    return next(e);
  }
};

/**
 * DELETE /accesos/users/:userId/:oposicionId (admin)
 * Cancela el acceso de un usuario a una oposición.
 */
export const cancelarAcceso = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const oposicionId = Number(req.params.oposicionId);
    const result = await accesoOposicionService.cancelarAcceso(userId, oposicionId);
    if (!result) return next(new ApiError(404, 'Acceso no encontrado'));
    return ok(res, result, 'Acceso cancelado');
  } catch (e) {
    return next(e);
  }
};

/**
 * PATCH /accesos/users/:userId/:oposicionId (admin)
 * Edita los campos de un acceso existente.
 * Body: { fechaFin?, precioPagado?, notas?, estado? }
 */
export const editarAcceso = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const oposicionId = Number(req.params.oposicionId);
    const ESTADOS_VALIDOS = ['activo', 'cancelado', 'expirado'];
    const { fechaFin, precioPagado, notas, estado, tipoAlumno, modoPreparacion } = req.body;
    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return next(new ApiError(400, `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`));
    }
    const result = await accesoOposicionService.updateAcceso(userId, oposicionId, {
      fechaFin: fechaFin ?? null,
      precioPagado: precioPagado != null ? Number(precioPagado) : null,
      notas: notas ?? null,
      estado: estado ?? 'activo',
      tipoAlumno: tipoAlumno ?? null,
      modoPreparacion: modoPreparacion ?? null,
    });
    if (!result) return next(new ApiError(404, 'Acceso no encontrado'));
    return ok(res, result, 'Acceso actualizado');
  } catch (e) {
    return next(e);
  }
};

/**
 * GET /accesos/stats (admin)
 */
export const getAccesosStats = async (req, res, next) => {
  try {
    const stats = await accesoOposicionService.getStats();
    return ok(res, stats, 'Stats de accesos');
  } catch (e) {
    return next(e);
  }
};
