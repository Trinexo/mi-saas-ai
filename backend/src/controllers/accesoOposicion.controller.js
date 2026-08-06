import { ok, created } from '../utils/response.js';
import { accesoOposicionService } from '../services/accesoOposicion.service.js';
import { accessContextService } from '../services/accessContext.service.js';
import { accessModeService } from '../services/accessMode.service.js';
import { accessAdminService } from '../services/accessAdmin.service.js';
import { ApiError } from '../utils/api-error.js';

function mapearErrorContexto(error) {
  switch (error?.code) {
    case 'ACCESS_CONTEXT_INVALID_IDENTIFIER':
      return new ApiError(400, 'Parámetros inválidos');
    case 'ACCESS_CONTEXT_INVALID_PRINCIPAL':
    case 'ACCESS_CONTEXT_USER_NOT_FOUND':
      return new ApiError(401, 'Contexto de autenticación inválido');
    case 'ACCESS_CONTEXT_OPPOSITION_NOT_FOUND':
      return new ApiError(404, 'Oposición no encontrada');
    case 'ACCESS_CONTEXT_INCONSISTENT':
      return new ApiError(500, 'No se pudo resolver el contexto');
    default:
      return new ApiError(500, 'No se pudo resolver el contexto');
  }
}

function mapearErrorModo(error) {
  switch (error?.code) {
    case 'ACCESS_MODE_INVALID_IDENTIFIER':
      return new ApiError(400, 'Parámetros inválidos');
    case 'ACCESS_MODE_INVALID_MODE':
      return new ApiError(422, 'Modo inválido');
    case 'ACCESS_MODE_FORBIDDEN':
      return new ApiError(403, 'Acceso no disponible');
    case 'ACCESS_MODE_NOT_INCLUDED':
    case 'ACCESS_MODE_STATE_FORBIDDEN':
      return new ApiError(409, 'No se puede cambiar el modo en el estado actual');
    case 'ACCESS_MODE_INCONSISTENT':
    default:
      return new ApiError(500, 'No se pudo actualizar el modo activo');
  }
}

function mapearErrorAdministracion(error) {
  switch (error?.code) {
    case 'ACCESS_ADMIN_INVALID_IDENTIFIER':
    case 'ACCESS_ADMIN_INVALID_MOTIVE':
    case 'ACCESS_ADMIN_INVALID_DATE':
    case 'ACCESS_ADMIN_INVALID_TYPE':
      return new ApiError(400, 'Parámetros inválidos');
    case 'ACCESS_ADMIN_INVALID_PRINCIPAL':
      return new ApiError(403, 'No autorizado para este recurso');
    case 'ACCESS_ADMIN_USER_NOT_FOUND':
    case 'ACCESS_ADMIN_OPPOSITION_NOT_FOUND':
    case 'ACCESS_ADMIN_NOT_FOUND':
      return new ApiError(404, 'Recurso no encontrado');
    case 'ACCESS_ADMIN_DUPLICATE':
    case 'ACCESS_ADMIN_CONFLICT':
    case 'ACCESS_ADMIN_STATE':
      return new ApiError(409, 'La operación no es válida para el estado actual');
    case 'ACCESS_ADMIN_INVALID_MODE':
    case 'ACCESS_ADMIN_INVALID_MODELS':
      return new ApiError(422, 'Modelos o modo inválidos');
    default:
      return new ApiError(500, 'No se pudo actualizar el acceso');
  }
}

function principalAdmin(req) {
  return { tipo: 'administrador', usuarioId: req.user.userId };
}

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
 * GET /api/v1/accesos/contexto/:oposicionId
 * Devuelve el contexto canónico del alumno autenticado.
 */
export const getContextoAcceso = async (req, res, next) => {
  try {
    const contexto = await accessContextService.obtenerContextoUsuario({
      usuarioId: req.user.userId,
      oposicionId: req.params.oposicionId,
      principal: {
        tipo: 'alumno',
        usuarioId: req.user.userId,
      },
    });
    return ok(res, contexto, 'Contexto de acceso');
  } catch (error) {
    return next(mapearErrorContexto(error));
  }
};

/**
 * PATCH /api/v1/accesos/:accesoId/modo-activo
 * Cambia el modo canónico del acceso del alumno autenticado.
 */
export const changeModoActivo = async (req, res, next) => {
  try {
    const contexto = await accessModeService.cambiarModoActivo({
      accesoId: req.params.accesoId,
      usuarioId: req.user.userId,
      actorUsuarioId: req.user.userId,
      modo: req.body.modo,
    });
    return ok(res, contexto, 'Modo activo actualizado');
  } catch (error) {
    return next(mapearErrorModo(error));
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

export const crearAccesoAdministrativo = async (req, res, next) => {
  try {
    const data = await accessAdminService.crearAcceso({
      ...req.body,
      actorUsuarioId: req.user.userId,
      principal: principalAdmin(req),
    });
    return created(res, data, 'Acceso creado');
  } catch (error) {
    return next(mapearErrorAdministracion(error));
  }
};

export const modificarModelosAdministrativo = async (req, res, next) => {
  try {
    const data = await accessAdminService.modificarModelos({
      ...req.body,
      accesoId: req.params.accesoId,
      actorUsuarioId: req.user.userId,
      principal: principalAdmin(req),
    });
    return ok(res, data, 'Modelos actualizados');
  } catch (error) {
    return next(mapearErrorAdministracion(error));
  }
};

export const modificarVigenciaAdministrativo = async (req, res, next) => {
  try {
    const data = await accessAdminService.modificarVigencia({
      ...req.body,
      accesoId: req.params.accesoId,
      actorUsuarioId: req.user.userId,
      principal: principalAdmin(req),
    });
    return ok(res, data, 'Vigencia actualizada');
  } catch (error) {
    return next(mapearErrorAdministracion(error));
  }
};

export const listarHistorialAdministrativo = async (req, res, next) => {
  try {
    const data = await accessAdminService.listarHistorial({
      accesoId: req.params.accesoId,
      principal: principalAdmin(req),
    });
    return ok(res, data, 'Historial del acceso');
  } catch (error) {
    return next(mapearErrorAdministracion(error));
  }
};
