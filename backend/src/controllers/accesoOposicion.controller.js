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
    const { oposicionId } = req.params;
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
    const { oposicionId } = req.params;
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
    const { oposicionId } = req.params;
    const { modoPreparacion, modo_preparacion, rankingPublico, ranking_publico } = req.body ?? {};
    const modo = modoPreparacion ?? modo_preparacion;
    const hasRankingPublico = rankingPublico !== undefined || ranking_publico !== undefined;

    const acceso = await accesoOposicionService.updatePreparacion(req.user.userId, oposicionId, {
      modoPreparacion: modo ?? null,
      rankingPublico: hasRankingPublico ? rankingPublico ?? ranking_publico : null,
    });
    return ok(res, acceso, 'Preparacion actualizada');
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
      page,
      pageSize: page_size,
      email: email ?? null,
      oposicionId: oposicion_id ?? null,
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
    const usuario = await accesoOposicionService.getUserByEmail(email.trim());
    if (!usuario) return next(new ApiError(404, `No existe ningún usuario con el email: ${email}`));
    const acceso = await accesoOposicionService.asignarAcceso({
      userId: usuario.id,
      oposicionId,
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
    const { userId, oposicionId } = req.params;
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
    const { userId, oposicionId } = req.params;
    const { fechaFin, precioPagado, notas, estado, tipoAlumno, modoPreparacion } = req.body;
    const result = await accesoOposicionService.updateAcceso(userId, oposicionId, {
      fechaFin: fechaFin ?? null,
      precioPagado: precioPagado ?? null,
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
