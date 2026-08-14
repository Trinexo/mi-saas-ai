import pool from '../config/db.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { accessAdminService } from './accessAdmin.service.js';
import { accessContextService } from './accessContext.service.js';
import { accessModeService } from './accessMode.service.js';

const DEFAULT_MOTIVES = Object.freeze({
  cancel: 'Compatibilidad legacy: cancelación administrativa',
  assign: 'Compatibilidad legacy: asignación administrativa',
  update: 'Compatibilidad legacy: actualización administrativa',
});

function legacyError(code, message, status = 409) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function principalAdmin(actorUsuarioId) {
  return { tipo: 'administrador', usuarioId: actorUsuarioId };
}

function modoCanonico(modo) {
  if (modo === 'experto') return { modoActivo: 'experto', modelo: 'experto' };
  if (modo === 'albacer') return { modoActivo: 'guiado', modelo: 'guiado' };
  throw legacyError('ACCESS_ADMIN_INVALID_MODE', 'Modo legacy inválido', 422);
}

function getMotivo(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function estadoEfectivo(row, now = new Date()) {
  if (row.estado === 'activo' && row.fecha_fin && new Date(row.fecha_fin) <= now) return 'expirado';
  return row.estado;
}

export function createAccessLegacyAdapter({
  db = pool,
  accesoRepository = accesoOposicionRepository,
  adminService = accessAdminService,
  contextService = accessContextService,
  modeService = accessModeService,
  clock = () => new Date(),
} = {}) {
  async function resolveAccess(userId, oposicionId) {
    const rows = await accesoRepository.obtenerLecturaContexto(userId, oposicionId, db);
    const row = rows[0];
    if (!row?.acceso_id) return null;
    return row;
  }

  async function actualizarPreparacion({ usuarioId, oposicionId, modoPreparacion, rankingPublico }) {
    const access = await resolveAccess(usuarioId, oposicionId);
    const effectiveState = access ? estadoEfectivo(access, clock()) : null;
    if (!access || !['activo', 'pendiente_modo'].includes(effectiveState)) {
      throw legacyError('ACCESS_LEGACY_ACCESS_UNAVAILABLE', 'Acceso no disponible', 404);
    }

    if (modoPreparacion !== undefined && modoPreparacion !== null) {
      const canonical = modoCanonico(modoPreparacion);
      return modeService.cambiarModoActivo({
        accesoId: access.acceso_id,
        usuarioId,
        actorUsuarioId: usuarioId,
        modo: canonical.modoActivo,
        rankingPublico,
      });
    }

    if (rankingPublico === undefined || rankingPublico === null) {
      throw legacyError('ACCESS_LEGACY_INVALID_UPDATE', 'No hay cambios legacy', 400);
    }
    return modeService.actualizarRankingPublico({ usuarioId, accesoId: access.acceso_id, rankingPublico });
  }

  async function asignar({ usuarioId, oposicionId, fechaFin, precioPagado, notas, tipoAlumno, modoPreparacion, actorUsuarioId, motivo }) {
    const canonical = modoCanonico(modoPreparacion ?? 'albacer');
    return adminService.crearAcceso({
      usuarioId,
      oposicionId,
      modelos: [canonical.modelo],
      modoActivo: canonical.modoActivo,
      vigencia: { fechaInicio: new Date(clock()).toISOString(), fechaFin: fechaFin ?? null },
      tipoAlumno,
      precioPagado,
      notas,
      actorUsuarioId,
      motivo: getMotivo(motivo, DEFAULT_MOTIVES.assign),
      principal: principalAdmin(actorUsuarioId),
    });
  }

  async function cancelar({ usuarioId, oposicionId, actorUsuarioId, motivo }) {
    const access = await resolveAccess(usuarioId, oposicionId);
    if (!access) return null;
    return adminService.cancelarAcceso({
      accesoId: access.acceso_id,
      actorUsuarioId,
      motivo: getMotivo(motivo, DEFAULT_MOTIVES.cancel),
      principal: principalAdmin(actorUsuarioId),
    });
  }

  async function actualizar({ usuarioId, oposicionId, payload, actorUsuarioId }) {
    const access = await resolveAccess(usuarioId, oposicionId);
    if (!access) return null;
    const motivo = getMotivo(payload.motivo, DEFAULT_MOTIVES.update);
    const hasState = payload.estado !== undefined;
    const hasMode = payload.modoPreparacion !== undefined;
    const hasValidity = payload.fechaFin !== undefined;
    const hasCommercial = payload.precioPagado !== undefined
      || payload.notas !== undefined || payload.tipoAlumno !== undefined;
    const categories = [hasState, hasMode, hasValidity, hasCommercial].filter(Boolean).length;

    if (categories === 0) throw legacyError('ACCESS_LEGACY_INVALID_UPDATE', 'No hay cambios legacy', 400);
    if (hasCommercial && categories > 1 && typeof adminService.actualizarAccesoLegacy !== 'function') {
      throw legacyError('ACCESS_LEGACY_AMBIGUOUS', 'La actualización legacy no es atómica', 409);
    }
    const principal = principalAdmin(actorUsuarioId);

    if (hasCommercial || categories > 1) {
      return adminService.actualizarAccesoLegacy({
        accesoId: access.acceso_id,
        payload,
        actorUsuarioId,
        motivo,
        principal,
      });
    }
    if (hasMode) {
      const canonical = modoCanonico(payload.modoPreparacion);
      return adminService.modificarModelos({
        accesoId: access.acceso_id,
        modelos: [canonical.modelo],
        modoActivo: canonical.modoActivo,
        actorUsuarioId,
        motivo,
        principal,
      });
    }
    if (hasValidity) {
      return adminService.modificarVigencia({ accesoId: access.acceso_id, fechaFin: payload.fechaFin, actorUsuarioId, motivo, principal });
    }

    const effective = estadoEfectivo(access, clock());
    if (payload.estado === 'cancelado') return adminService.cancelarAcceso({ accesoId: access.acceso_id, actorUsuarioId, motivo, principal });
    if (payload.estado === 'revocado') return adminService.revocarAcceso({ accesoId: access.acceso_id, actorUsuarioId, motivo, principal });
    if (payload.estado === 'activo' && effective === 'expirado') {
      return adminService.renovarAcceso({ accesoId: access.acceso_id, actorUsuarioId, motivo, principal });
    }
    if (payload.estado === 'activo' && ['revocado', 'cancelado'].includes(effective)) {
      return adminService.reactivarAcceso({ accesoId: access.acceso_id, actorUsuarioId, motivo, principal });
    }
    if (payload.estado === access.estado) return contextService.obtenerContextoUsuario({
      usuarioId,
      oposicionId,
      principal,
    });
    throw legacyError('ACCESS_LEGACY_AMBIGUOUS', 'Transición de estado legacy ambigua', 409);
  }

  return { actualizarPreparacion, asignar, cancelar, actualizar };
}

export const accessLegacyAdapter = createAccessLegacyAdapter();
