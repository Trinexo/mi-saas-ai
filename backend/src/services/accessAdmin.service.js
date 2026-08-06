import pool from '../config/db.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { accesoOposicionModelosRepository } from '../repositories/accesoOposicionModelos.repository.js';
import { accesoOposicionHistorialRepository } from '../repositories/accesoOposicionHistorial.repository.js';
import { createAccessContextService } from './accessContext.service.js';

const MAX_BIGINT = 9223372036854775807n;
const MODOS = Object.freeze(['experto', 'guiado']);
const ESTADOS_MODELOS = new Set(['activo', 'pendiente_modo', 'expirado']);
const ESTADOS_VIGENCIA = new Set(['activo', 'pendiente_modo']);

function errorConCodigo(code, message, status = null) {
  const error = new Error(message);
  error.code = code;
  if (status !== null) error.status = status;
  return error;
}

function validarId(value, nombre) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value) && BigInt(value) <= MAX_BIGINT) return value;
  throw errorConCodigo('ACCESS_ADMIN_INVALID_IDENTIFIER', `${nombre} inválido`, 400);
}

function validarMotivo(motivo) {
  if (typeof motivo !== 'string' || motivo.trim() === '') {
    throw errorConCodigo('ACCESS_ADMIN_INVALID_MOTIVE', 'El motivo es obligatorio', 400);
  }
  return motivo.trim();
}

function normalizarModelos(modelos) {
  if (!Array.isArray(modelos) || modelos.length === 0 || modelos.length > 2) {
    throw errorConCodigo('ACCESS_ADMIN_INVALID_MODELS', 'modelos debe ser una lista no vacía', 422);
  }
  const unique = new Set(modelos);
  if (unique.size !== modelos.length || modelos.some((modelo) => !MODOS.includes(modelo))) {
    throw errorConCodigo('ACCESS_ADMIN_INVALID_MODELS', 'Modelos inválidos', 422);
  }
  return MODOS.filter((modelo) => unique.has(modelo));
}

function modoLegacy(modoActivo) {
  return modoActivo === 'guiado' ? 'albacer' : 'experto';
}

function validarModo(modoActivo, modelos) {
  if (modoActivo !== undefined && modoActivo !== null && !modelos.includes(modoActivo)) {
    throw errorConCodigo('ACCESS_ADMIN_INVALID_MODE', 'El modo activo debe estar incluido', 422);
  }
  return modoActivo ?? null;
}

function fecha(value, nombre, { permitirNull = false } = {}) {
  if (value === null && permitirNull) return null;
  if (typeof value !== 'string' || value.trim() === '') {
    throw errorConCodigo('ACCESS_ADMIN_INVALID_DATE', `${nombre} inválida`, 400);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw errorConCodigo('ACCESS_ADMIN_INVALID_DATE', `${nombre} inválida`, 400);
  }
  return parsed;
}

function validarOrden(inicio, fin) {
  if (fin !== null && fin.getTime() < inicio.getTime()) {
    throw errorConCodigo('ACCESS_ADMIN_INVALID_DATE', 'fechaFin no puede ser anterior a fechaInicio', 422);
  }
}

function mapearAcceso(row) {
  return {
    ...row,
    id: row.id,
    usuario_id: row.usuario_id,
    oposicion_id: row.oposicion_id,
    fecha_inicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin,
  };
}

function snapshot(acceso, modelos) {
  return {
    estado: acceso.estado,
    modoActivo: acceso.modo_activo,
    modelos,
    vigencia: {
      fechaInicio: acceso.fecha_inicio,
      fechaFin: acceso.fecha_fin,
    },
  };
}

async function leerAcceso(client, accesoId, { forUpdate = false } = {}) {
  const lock = forUpdate ? ' FOR UPDATE' : '';
  const result = await client.query(
    `SELECT id, usuario_id, oposicion_id, estado, modo_preparacion, modo_activo,
            fecha_inicio::TEXT AS fecha_inicio, fecha_fin::TEXT AS fecha_fin,
            tipo_alumno, precio_pagado, notas, ranking_publico, creada_en, actualizada_en
       FROM accesos_oposicion
      WHERE id = $1${lock}`,
    [accesoId],
  );
  return result.rows[0] ?? null;
}

async function leerModelos(client, accesoId, modelosRepository = accesoOposicionModelosRepository) {
  const rows = await modelosRepository.listarPorAcceso(accesoId, client);
  return rows.map((row) => row.modelo);
}

async function contextoFinal({ client, contextService, acceso, principal }) {
  return contextService.obtenerContextoUsuario({
    usuarioId: acceso.usuario_id,
    oposicionId: acceso.oposicion_id,
    principal,
  });
}

async function enTransaccion(db, callback) {
  const client = await db.connect();
  let begun = false;
  try {
    await client.query('BEGIN');
    begun = true;
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    if (begun) await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

function mapearErrorDb(error) {
  if (error?.code === '23505') return errorConCodigo('ACCESS_ADMIN_CONFLICT', 'El acceso ya existe', 409);
  if (error?.code?.startsWith('ACCESS_ADMIN_')) return error;
  return error;
}

export function createAccessAdminService({
  db = pool,
  accesoRepository = accesoOposicionRepository,
  modelosRepository = accesoOposicionModelosRepository,
  historialRepository = accesoOposicionHistorialRepository,
  contextService,
  clock = () => new Date(),
} = {}) {
  const context = contextService ?? createAccessContextService({ db, accesoRepository, clock });

  const requirePrincipal = (principal, actorUsuarioId) => {
    if (!principal || principal.tipo !== 'administrador'
      || principal.usuarioId === undefined
      || BigInt(principal.usuarioId) !== BigInt(actorUsuarioId)) {
      throw errorConCodigo('ACCESS_ADMIN_INVALID_PRINCIPAL', 'Principal administrativo inválido', 403);
    }
  };

  const mutate = async ({ actorUsuarioId, principal, motivo, callback }) => {
    const actor = validarId(actorUsuarioId, 'actorUsuarioId');
    requirePrincipal(principal, actor);
    const reason = validarMotivo(motivo);
    try {
      return await enTransaccion(db, (client) => callback({ client, actor, reason }));
    } catch (error) {
      throw mapearErrorDb(error);
    }
  };

  return {
    async crearAcceso({ usuarioId, oposicionId, modelos, modoActivo, vigencia, tipoAlumno = 'libre', precioPagado = null, notas = null, actorUsuarioId, motivo, principal }) {
      const userId = validarId(usuarioId, 'usuarioId');
      const oppositionId = validarId(oposicionId, 'oposicionId');
      const canonicalModels = normalizarModelos(modelos);
      const activeMode = canonicalModels.length === 1
        ? (modoActivo == null ? canonicalModels[0] : validarModo(modoActivo, canonicalModels))
        : validarModo(modoActivo, canonicalModels);
      const start = fecha(vigencia?.fechaInicio, 'fechaInicio');
      const end = fecha(vigencia?.fechaFin, 'fechaFin', { permitirNull: true });
      validarOrden(start, end);
      if (tipoAlumno !== 'libre' && tipoAlumno !== 'albacer') {
        throw errorConCodigo('ACCESS_ADMIN_INVALID_TYPE', 'tipoAlumno inválido', 400);
      }
      return mutate({ actorUsuarioId, principal, motivo, callback: async ({ client, actor, reason }) => {
        const [user, opposition] = await Promise.all([
          client.query('SELECT id FROM usuarios WHERE id = $1', [userId]),
          client.query('SELECT id FROM oposiciones WHERE id = $1', [oppositionId]),
        ]);
        if (user.rowCount === 0) throw errorConCodigo('ACCESS_ADMIN_USER_NOT_FOUND', 'Usuario no encontrado', 404);
        if (opposition.rowCount === 0) throw errorConCodigo('ACCESS_ADMIN_OPPOSITION_NOT_FOUND', 'Oposición no encontrada', 404);
        const duplicate = await client.query(
          'SELECT id FROM accesos_oposicion WHERE usuario_id = $1 AND oposicion_id = $2 FOR UPDATE',
          [userId, oppositionId],
        );
        if (duplicate.rowCount > 0) throw errorConCodigo('ACCESS_ADMIN_DUPLICATE', 'El acceso ya existe', 409);
        const estado = activeMode ? 'activo' : 'pendiente_modo';
        const legacy = modoLegacy(activeMode ?? canonicalModels[0]);
        const inserted = await client.query(
          `INSERT INTO accesos_oposicion
             (usuario_id, oposicion_id, estado, fecha_inicio, fecha_fin, precio_pagado,
              notas, tipo_alumno, modo_preparacion, modo_activo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, usuario_id, oposicion_id, estado, modo_preparacion, modo_activo,
                     fecha_inicio::TEXT AS fecha_inicio, fecha_fin::TEXT AS fecha_fin,
                     tipo_alumno, precio_pagado, notas, ranking_publico, creada_en, actualizada_en`,
          [userId, oppositionId, estado, start.toISOString(), end ? end.toISOString() : null,
            precioPagado, notas, tipoAlumno, legacy, activeMode],
        );
        const access = mapearAcceso(inserted.rows[0]);
        for (const modelo of canonicalModels) await modelosRepository.insertarModelo(access.id, modelo, client);
        await historialRepository.insertarEvento({
          accesoId: access.id,
          tipoEvento: 'acceso_creado',
          anterior: null,
          nuevo: snapshot(access, canonicalModels),
          actorUsuarioId: actor,
          motivo: reason,
          metadata: null,
        }, client);
        return contextoFinal({ client, contextService: context, acceso: access, principal });
      }});
    },

    async modificarModelos({ accesoId, modelos, modoActivo, actorUsuarioId, motivo, principal }) {
      const id = validarId(accesoId, 'accesoId');
      const canonicalModels = normalizarModelos(modelos);
      return mutate({ actorUsuarioId, principal, motivo, callback: async ({ client, actor, reason }) => {
        const access = await leerAcceso(client, id, { forUpdate: true });
        if (!access) throw errorConCodigo('ACCESS_ADMIN_NOT_FOUND', 'Acceso no encontrado', 404);
        if (!ESTADOS_MODELOS.has(access.estado)) throw errorConCodigo('ACCESS_ADMIN_STATE', 'Estado no modificable', 409);
        const currentModels = await leerModelos(client, id, modelosRepository);
        const selected = modoActivo == null
          ? (canonicalModels.includes(access.modo_activo) ? access.modo_activo : canonicalModels.length === 1 ? canonicalModels[0] : null)
          : validarModo(modoActivo, canonicalModels);
        const nextState = access.estado === 'expirado'
          ? 'expirado'
          : selected ? 'activo' : 'pendiente_modo';
        const nextLegacy = modoLegacy(selected ?? canonicalModels[0]);
        const unchanged = JSON.stringify(currentModels) === JSON.stringify(canonicalModels)
          && access.modo_activo === selected && access.estado === nextState
          && access.modo_preparacion === nextLegacy;
        if (!unchanged) {
          await modelosRepository.reemplazarModelos(id, canonicalModels, client);
          const updated = await client.query(
            `UPDATE accesos_oposicion
                SET estado = $2, modo_activo = $3, modo_preparacion = $4, actualizada_en = NOW()
              WHERE id = $1
              RETURNING id, usuario_id, oposicion_id, estado, modo_preparacion, modo_activo,
                        fecha_inicio::TEXT AS fecha_inicio, fecha_fin::TEXT AS fecha_fin,
                        tipo_alumno, precio_pagado, notas, ranking_publico, creada_en, actualizada_en`,
            [id, nextState, selected, nextLegacy],
          );
          const next = mapearAcceso(updated.rows[0]);
          await historialRepository.insertarEvento({
            accesoId: id,
            tipoEvento: 'modelos_modificados',
            anterior: snapshot(access, currentModels),
            nuevo: snapshot(next, canonicalModels),
            actorUsuarioId: actor,
            motivo: reason,
            metadata: null,
          }, client);
          return contextoFinal({ client, contextService: context, acceso: next, principal });
        }
        return contextoFinal({ client, contextService: context, acceso: access, principal });
      }});
    },

    async modificarVigencia({ accesoId, fechaInicio, fechaFin, actorUsuarioId, motivo, principal }) {
      const id = validarId(accesoId, 'accesoId');
      return mutate({ actorUsuarioId, principal, motivo, callback: async ({ client, actor, reason }) => {
        const access = await leerAcceso(client, id, { forUpdate: true });
        if (!access) throw errorConCodigo('ACCESS_ADMIN_NOT_FOUND', 'Acceso no encontrado', 404);
        if (!ESTADOS_VIGENCIA.has(access.estado)) throw errorConCodigo('ACCESS_ADMIN_STATE', 'Estado no modificable', 409);
        const start = fechaInicio === undefined ? fecha(access.fecha_inicio, 'fechaInicio') : fecha(fechaInicio, 'fechaInicio');
        const end = fechaFin === undefined ? fecha(access.fecha_fin, 'fechaFin', { permitirNull: true }) : fecha(fechaFin, 'fechaFin', { permitirNull: true });
        validarOrden(start, end);
        const unchanged = new Date(access.fecha_inicio).getTime() === start.getTime()
          && (access.fecha_fin === null ? end === null : new Date(access.fecha_fin).getTime() === end?.getTime());
        if (!unchanged) {
          const updated = await client.query(
            `UPDATE accesos_oposicion
                SET fecha_inicio = $2, fecha_fin = $3, actualizada_en = NOW()
              WHERE id = $1
              RETURNING id, usuario_id, oposicion_id, estado, modo_preparacion, modo_activo,
                        fecha_inicio::TEXT AS fecha_inicio, fecha_fin::TEXT AS fecha_fin,
                        tipo_alumno, precio_pagado, notas, ranking_publico, creada_en, actualizada_en`,
            [id, start.toISOString(), end ? end.toISOString() : null],
          );
          const next = mapearAcceso(updated.rows[0]);
          const models = await leerModelos(client, id, modelosRepository);
          await historialRepository.insertarEvento({
            accesoId: id,
            tipoEvento: 'vigencia_modificada',
            anterior: snapshot(access, models),
            nuevo: snapshot(next, models),
            actorUsuarioId: actor,
            motivo: reason,
            metadata: null,
          }, client);
          return contextoFinal({ client, contextService: context, acceso: next, principal });
        }
        return contextoFinal({ client, contextService: context, acceso: access, principal });
      }});
    },

    async listarHistorial({ accesoId, principal }) {
      const id = validarId(accesoId, 'accesoId');
      if (!principal || principal.tipo !== 'administrador' || principal.usuarioId === undefined) {
        throw errorConCodigo('ACCESS_ADMIN_INVALID_PRINCIPAL', 'Principal administrativo inválido', 403);
      }
      validarId(principal.usuarioId, 'principal.usuarioId');
      const client = await db.connect();
      try {
        const access = await leerAcceso(client, id);
        if (!access) throw errorConCodigo('ACCESS_ADMIN_NOT_FOUND', 'Acceso no encontrado', 404);
        return historialRepository.listarPorAcceso(id, client);
      } finally {
        client.release();
      }
    },
  };
}

export const accessAdminService = createAccessAdminService();
