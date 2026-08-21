import pool from '../config/db.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { accesoOposicionModelosRepository } from '../repositories/accesoOposicionModelos.repository.js';
import { accesoOposicionHistorialRepository } from '../repositories/accesoOposicionHistorial.repository.js';
import { createAccessContextService } from './accessContext.service.js';
import { DEFAULT_OPPOSITION_MODES, normalizeModes } from './accessModes.js';

const MAX_BIGINT = 9223372036854775807n;
const MODOS = Object.freeze(['experto', 'guiado']);
const ESTADOS_MODELOS = new Set(['activo', 'pendiente_modo', 'expirado']);
const ESTADOS_VIGENCIA = new Set(['activo', 'pendiente_modo']);
const ESTADOS_CICLO = new Set(['activo', 'pendiente_modo', 'expirado']);

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

function modoCanonico(modoPreparacion) {
  if (modoPreparacion === 'experto') return { modelo: 'experto', modoActivo: 'experto' };
  if (modoPreparacion === 'albacer') return { modelo: 'guiado', modoActivo: 'guiado' };
  throw errorConCodigo('ACCESS_ADMIN_INVALID_MODE', 'Modo legacy inválido', 422);
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

function esVigente(inicio, fin, referencia) {
  return inicio.getTime() <= referencia.getTime()
    && (fin === null || fin.getTime() > referencia.getTime());
}

function fechasAcceso(access) {
  return {
    inicio: new Date(access.fecha_inicio),
    fin: access.fecha_fin === null ? null : new Date(access.fecha_fin),
  };
}

function estadoEfectivo(access, referencia) {
  const { fin } = fechasAcceso(access);
  return access.estado === 'activo' && fin !== null && fin.getTime() <= referencia.getTime()
    ? 'expirado'
    : access.estado;
}

function compararFechas(access, inicio, fin) {
  const actuales = fechasAcceso(access);
  return actuales.inicio.getTime() === inicio.getTime()
    && (actuales.fin === null ? fin === null : fin !== null && actuales.fin.getTime() === fin.getTime());
}

function validarVigenciaOperativa(inicio, fin, referencia) {
  validarOrden(inicio, fin);
  if (!esVigente(inicio, fin, referencia)) {
    throw errorConCodigo('ACCESS_ADMIN_INVALID_VALIDITY', 'La vigencia debe estar activa', 422);
  }
}

function resolverModelosYModo(currentModels, currentMode, requestedModels, requestedMode) {
  const modelos = requestedModels === undefined ? [...currentModels] : normalizarModelos(requestedModels);
  if (modelos.length === 0) throw errorConCodigo('ACCESS_ADMIN_INVALID_MODELS', 'El acceso requiere modelos', 422);
  const modo = requestedMode === undefined
    ? (modelos.includes(currentMode) ? currentMode : modelos.length === 1 ? modelos[0] : null)
    : requestedMode === null
      ? (modelos.length === 1 ? modelos[0] : null)
      : validarModo(requestedMode, modelos);
  const estado = modo === null && modelos.length > 1 ? 'pendiente_modo' : 'activo';
  return { modelos, modo, estado, legacy: modoLegacy(modo ?? modelos[0]) };
}

function validarAccesoCoherente(access, modelos) {
  if (!Array.isArray(modelos) || modelos.length === 0 || modelos.some((modelo) => !MODOS.includes(modelo))) {
    throw errorConCodigo('ACCESS_ADMIN_INCONSISTENT', 'Acceso sin modelos canónicos', 500);
  }
  if (access.modo_activo !== null && !modelos.includes(access.modo_activo)) {
    throw errorConCodigo('ACCESS_ADMIN_INCONSISTENT', 'Modo activo no incluido', 500);
  }
  if (access.estado === 'activo' && access.modo_activo === null) {
    throw errorConCodigo('ACCESS_ADMIN_INCONSISTENT', 'Activo sin modo activo', 500);
  }
  if (access.estado === 'pendiente_modo' && (modelos.length < 2 || access.modo_activo !== null)) {
    throw errorConCodigo('ACCESS_ADMIN_INCONSISTENT', 'Pendiente de modo incoherente', 500);
  }
  const legacy = access.modo_preparacion === 'albacer' ? 'guiado' : access.modo_preparacion;
  if (!['experto', 'guiado'].includes(legacy) || !modelos.includes(legacy)) {
    throw errorConCodigo('ACCESS_ADMIN_INCONSISTENT', 'Legacy incoherente', 500);
  }
  if (modelos.length === 1 && access.modo_activo !== legacy) {
    throw errorConCodigo('ACCESS_ADMIN_INCONSISTENT', 'Modo legacy discrepante', 500);
  }
}

function validarModosOposicion(modelos, modosOposicion) {
  const allowed = normalizeModes(modosOposicion, DEFAULT_OPPOSITION_MODES);
  if (modelos.some((modelo) => !allowed.includes(modelo))) {
    throw errorConCodigo('ACCESS_ADMIN_MODE_NOT_ALLOWED_BY_OPPOSITION', 'El acceso solicita un modo no permitido por la oposición', 409);
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
    client,
  });
}

function valoresComerciales(access, payload) {
  const candidates = [
    ['precioPagado', 'precio_pagado'],
    ['notas', 'notas'],
    ['tipoAlumno', 'tipo_alumno'],
  ];
  const changed = [];
  for (const [input, column] of candidates) {
    if (payload[input] === undefined) continue;
    const before = access[column];
    const after = payload[input];
    const equal = input === 'precioPagado'
      ? (before === null && after === null)
        || (before !== null && after !== null && Number(before) === Number(after))
      : before === after;
    if (!equal) changed.push({ input, column, before, after });
  }
  return changed;
}

function metadataComercial(changes) {
  const order = ['precioPagado', 'notas', 'tipoAlumno'];
  const ordered = order.filter((field) => changes.some((change) => change.input === field));
  const anterior = {};
  const nuevo = {};
  for (const field of ordered) {
    const change = changes.find((item) => item.input === field);
    anterior[field] = change.before;
    nuevo[field] = change.after;
  }
  return { camposModificados: ordered, anterior, nuevo };
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

  const cambiarEstadoCiclo = async ({ accesoId, estadoDestino, tipoEvento, actorUsuarioId, motivo, principal }) => {
    const id = validarId(accesoId, 'accesoId');
    return mutate({ actorUsuarioId, principal, motivo, callback: async ({ client, actor, reason }) => {
      const access = await leerAcceso(client, id, { forUpdate: true });
      if (!access) throw errorConCodigo('ACCESS_ADMIN_NOT_FOUND', 'Acceso no encontrado', 404);
      if (access.estado === estadoDestino) return contextoFinal({ client, contextService: context, acceso: access, principal });
      const effective = estadoEfectivo(access, new Date(clock()));
      if (!ESTADOS_CICLO.has(effective)) throw errorConCodigo('ACCESS_ADMIN_STATE', 'Estado no modificable', 409);
      if (effective === 'cancelado' || effective === 'revocado') {
        throw errorConCodigo('ACCESS_ADMIN_STATE', 'Transición incompatible', 409);
      }
      const currentModels = await leerModelos(client, id, modelosRepository);
      validarAccesoCoherente(access, currentModels);
      const updated = await client.query(
        `UPDATE accesos_oposicion
            SET estado = $2, actualizada_en = NOW()
          WHERE id = $1
          RETURNING id, usuario_id, oposicion_id, estado, modo_preparacion, modo_activo,
                    fecha_inicio::TEXT AS fecha_inicio, fecha_fin::TEXT AS fecha_fin,
                    tipo_alumno, precio_pagado, notas, ranking_publico, creada_en, actualizada_en`,
        [id, estadoDestino],
      );
      const next = mapearAcceso(updated.rows[0]);
      await historialRepository.insertarEvento({
        accesoId: id,
        tipoEvento,
        anterior: snapshot(access, currentModels),
        nuevo: snapshot(next, currentModels),
        actorUsuarioId: actor,
        motivo: reason,
        metadata: null,
      }, client);
      return contextoFinal({ client, contextService: context, acceso: next, principal });
    }});
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
          client.query('SELECT id, modelos_disponibles FROM oposiciones WHERE id = $1', [oppositionId]),
        ]);
        if (user.rowCount === 0) throw errorConCodigo('ACCESS_ADMIN_USER_NOT_FOUND', 'Usuario no encontrado', 404);
        if (opposition.rowCount === 0) throw errorConCodigo('ACCESS_ADMIN_OPPOSITION_NOT_FOUND', 'Oposición no encontrada', 404);
        if (opposition.rows[0]?.modelos_disponibles !== undefined) {
          validarModosOposicion(canonicalModels, opposition.rows[0].modelos_disponibles);
        }
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
        const opposition = await client.query('SELECT modelos_disponibles FROM oposiciones WHERE id = $1', [access.oposicion_id]);
        if (opposition.rows[0]?.modelos_disponibles !== undefined) {
          validarModosOposicion(canonicalModels, opposition.rows[0].modelos_disponibles);
        }
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

    async modificarDatosComerciales({ accesoId, precioPagado, notas, tipoAlumno, actorUsuarioId, motivo, principal }) {
      const id = validarId(accesoId, 'accesoId');
      if (tipoAlumno !== undefined && !['libre', 'albacer'].includes(tipoAlumno)) {
        throw errorConCodigo('ACCESS_ADMIN_INVALID_TYPE', 'tipoAlumno inválido', 400);
      }
      if (precioPagado !== undefined && precioPagado !== null
        && (typeof precioPagado !== 'number' || !Number.isFinite(precioPagado) || precioPagado < 0)) {
        throw errorConCodigo('ACCESS_ADMIN_INVALID_COMMERCIAL_DATA', 'precioPagado inválido', 422);
      }
      if (notas !== undefined && notas !== null && typeof notas !== 'string') {
        throw errorConCodigo('ACCESS_ADMIN_INVALID_COMMERCIAL_DATA', 'notas inválidas', 422);
      }
      return mutate({ actorUsuarioId, principal, motivo, callback: async ({ client, actor, reason }) => {
        const access = await leerAcceso(client, id, { forUpdate: true });
        if (!access) throw errorConCodigo('ACCESS_ADMIN_NOT_FOUND', 'Acceso no encontrado', 404);
        const currentModels = await leerModelos(client, id, modelosRepository);
        validarAccesoCoherente(access, currentModels);
        const changes = valoresComerciales(access, { precioPagado, notas, tipoAlumno });
        if (changes.length === 0) return contextoFinal({ client, contextService: context, acceso: access, principal });
        const sets = [];
        const params = [id];
        for (const change of changes) {
          params.push(change.after);
          sets.push(`${change.column} = $${params.length}`);
        }
        const updated = await client.query(
          `UPDATE accesos_oposicion SET ${sets.join(', ')}, actualizada_en = NOW()
             WHERE id = $1
             RETURNING id, usuario_id, oposicion_id, estado, modo_preparacion, modo_activo,
                       fecha_inicio::TEXT AS fecha_inicio, fecha_fin::TEXT AS fecha_fin,
                       tipo_alumno, precio_pagado, notas, ranking_publico, creada_en, actualizada_en`,
          params,
        );
        const next = mapearAcceso(updated.rows[0]);
        await historialRepository.insertarEvento({
          accesoId: id,
          tipoEvento: 'datos_comerciales_modificados',
          anterior: snapshot(access, currentModels),
          nuevo: snapshot(next, currentModels),
          actorUsuarioId: actor,
          motivo: reason,
          metadata: metadataComercial(changes),
        }, client);
        return contextoFinal({ client, contextService: context, acceso: next, principal });
      }});
    },

    async actualizarAccesoLegacy({ accesoId, payload, actorUsuarioId, principal, motivo }) {
      const id = validarId(accesoId, 'accesoId');
      return mutate({ actorUsuarioId, principal, motivo, callback: async ({ client, actor, reason }) => {
        const access = await leerAcceso(client, id, { forUpdate: true });
        if (!access) throw errorConCodigo('ACCESS_ADMIN_NOT_FOUND', 'Acceso no encontrado', 404);
        const currentModels = await leerModelos(client, id, modelosRepository);
        validarAccesoCoherente(access, currentModels);
        const commercialChanges = valoresComerciales(access, payload);
        const currentEffective = estadoEfectivo(access, new Date(clock()));
        let nextModels = currentModels;
        let nextMode = access.modo_activo;
        let nextLegacy = access.modo_preparacion;
        let modeChanged = false;
        if (payload.modoPreparacion !== undefined) {
          const resolved = modoCanonico(payload.modoPreparacion);
          nextModels = [resolved.modelo];
          nextMode = resolved.modoActivo;
          nextLegacy = payload.modoPreparacion;
          modeChanged = JSON.stringify(nextModels) !== JSON.stringify(currentModels)
            || nextMode !== access.modo_activo || nextLegacy !== access.modo_preparacion;
        }
        let start = fechasAcceso(access).inicio;
        let end = fechasAcceso(access).fin;
        const validityChanged = payload.fechaInicio !== undefined || payload.fechaFin !== undefined;
        if (payload.fechaInicio !== undefined) start = fecha(payload.fechaInicio, 'fechaInicio');
        if (payload.fechaFin !== undefined) end = fecha(payload.fechaFin, 'fechaFin', { permitirNull: true });
        if (validityChanged) validarOrden(start, end);

        let nextState = access.estado;
        let lifecycleEvent = null;
        if (payload.estado !== undefined) {
          if (payload.estado === 'cancelado' || payload.estado === 'revocado') {
            if (currentEffective === 'cancelado' || currentEffective === 'revocado') {
              if (payload.estado !== currentEffective) throw errorConCodigo('ACCESS_ADMIN_STATE', 'Transición incompatible', 409);
            } else {
              nextState = payload.estado;
              lifecycleEvent = payload.estado;
            }
          } else if (payload.estado === 'activo') {
            if (currentEffective === 'expirado') {
              validarVigenciaOperativa(start, end, new Date(clock()));
              nextState = 'activo';
              lifecycleEvent = 'renovado';
            } else if (currentEffective === 'revocado' || currentEffective === 'cancelado') {
              validarVigenciaOperativa(start, end, new Date(clock()));
              nextState = 'activo';
              lifecycleEvent = 'reactivado';
            } else if (currentEffective !== 'activo') {
              throw errorConCodigo('ACCESS_ADMIN_STATE', 'Transición incompatible', 409);
            }
          } else if (payload.estado !== access.estado) {
            throw errorConCodigo('ACCESS_ADMIN_STATE', 'Transición incompatible', 409);
          }
        }
        if (modeChanged && nextModels.length === 1) nextState = nextState === 'expirado' ? 'expirado' : 'activo';
        const dateChanged = start.getTime() !== new Date(access.fecha_inicio).getTime()
          || (end === null ? access.fecha_fin !== null : access.fecha_fin === null || end.getTime() !== new Date(access.fecha_fin).getTime());
        const stateChanged = nextState !== access.estado;
        const anyChange = commercialChanges.length > 0 || modeChanged || dateChanged || stateChanged;
        if (!anyChange) return contextoFinal({ client, contextService: context, acceso: access, principal });

        const sets = [];
        const params = [id];
        const assign = (column, value) => { params.push(value); sets.push(`${column} = $${params.length}`); };
        for (const change of commercialChanges) assign(change.column, change.after);
        if (dateChanged) { assign('fecha_inicio', start.toISOString()); assign('fecha_fin', end ? end.toISOString() : null); }
        if (modeChanged) { assign('modo_preparacion', nextLegacy); assign('modo_activo', nextMode); }
        if (stateChanged) assign('estado', nextState);
        const updated = await client.query(
          `UPDATE accesos_oposicion SET ${sets.join(', ')}, actualizada_en = NOW()
             WHERE id = $1
             RETURNING id, usuario_id, oposicion_id, estado, modo_preparacion, modo_activo,
                       fecha_inicio::TEXT AS fecha_inicio, fecha_fin::TEXT AS fecha_fin,
                       tipo_alumno, precio_pagado, notas, ranking_publico, creada_en, actualizada_en`,
          params,
        );
        const next = mapearAcceso(updated.rows[0]);
        const before = snapshot(access, currentModels);
        const after = snapshot(next, nextModels);
        if (commercialChanges.length > 0) await historialRepository.insertarEvento({ accesoId: id, tipoEvento: 'datos_comerciales_modificados', anterior: before, nuevo: after, actorUsuarioId: actor, motivo: reason, metadata: metadataComercial(commercialChanges) }, client);
        if (modeChanged) await historialRepository.insertarEvento({ accesoId: id, tipoEvento: 'modelos_modificados', anterior: before, nuevo: after, actorUsuarioId: actor, motivo: reason, metadata: null }, client);
        if (dateChanged && lifecycleEvent !== 'renovado' && lifecycleEvent !== 'reactivado') await historialRepository.insertarEvento({ accesoId: id, tipoEvento: 'vigencia_modificada', anterior: before, nuevo: after, actorUsuarioId: actor, motivo: reason, metadata: null }, client);
        if (lifecycleEvent) await historialRepository.insertarEvento({ accesoId: id, tipoEvento: lifecycleEvent === 'revocado' ? 'revocado' : lifecycleEvent === 'cancelado' ? 'cancelado' : lifecycleEvent, anterior: before, nuevo: after, actorUsuarioId: actor, motivo: reason, metadata: null }, client);
        return contextoFinal({ client, contextService: context, acceso: next, principal });
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

    async renovarAcceso({ accesoId, fechaInicio, fechaFin, modelos, modoActivo, actorUsuarioId, motivo, principal }) {
      const id = validarId(accesoId, 'accesoId');
      return mutate({ actorUsuarioId, principal, motivo, callback: async ({ client, actor, reason }) => {
        const access = await leerAcceso(client, id, { forUpdate: true });
        if (!access) throw errorConCodigo('ACCESS_ADMIN_NOT_FOUND', 'Acceso no encontrado', 404);
        const currentModels = await leerModelos(client, id, modelosRepository);
        validarAccesoCoherente(access, currentModels);
        const reference = new Date(clock());
        const effective = estadoEfectivo(access, reference);
        if (!ESTADOS_CICLO.has(effective)) throw errorConCodigo('ACCESS_ADMIN_STATE', 'Estado no renovable', 409);

        const currentDates = fechasAcceso(access);
        let start;
        let end;
        if (effective === 'expirado') {
          if (fechaInicio === undefined || fechaFin === undefined) {
            throw errorConCodigo('ACCESS_ADMIN_INVALID_VALIDITY', 'La renovación requiere una vigencia válida', 422);
          }
          start = fecha(fechaInicio, 'fechaInicio');
          end = fecha(fechaFin, 'fechaFin', { permitirNull: true });
          validarVigenciaOperativa(start, end, reference);
        } else {
          start = fechaInicio === undefined ? currentDates.inicio : fecha(fechaInicio, 'fechaInicio');
          end = fechaFin === undefined ? currentDates.fin : fecha(fechaFin, 'fechaFin', { permitirNull: true });
          validarVigenciaOperativa(start, end, reference);
        }

        const resolved = resolverModelosYModo(currentModels, access.modo_activo, modelos, modoActivo);
        const unchanged = access.estado === resolved.estado
          && access.modo_activo === resolved.modo
          && access.modo_preparacion === resolved.legacy
          && compararFechas(access, start, end)
          && JSON.stringify(currentModels) === JSON.stringify(resolved.modelos);
        if (unchanged) return contextoFinal({ client, contextService: context, acceso: access, principal });

        if (JSON.stringify(currentModels) !== JSON.stringify(resolved.modelos)) {
          await modelosRepository.reemplazarModelos(id, resolved.modelos, client);
        }
        const updated = await client.query(
          `UPDATE accesos_oposicion
              SET estado = $2, fecha_inicio = $3, fecha_fin = $4,
                  modo_activo = $5, modo_preparacion = $6, actualizada_en = NOW()
            WHERE id = $1
            RETURNING id, usuario_id, oposicion_id, estado, modo_preparacion, modo_activo,
                      fecha_inicio::TEXT AS fecha_inicio, fecha_fin::TEXT AS fecha_fin,
                      tipo_alumno, precio_pagado, notas, ranking_publico, creada_en, actualizada_en`,
          [id, resolved.estado, start.toISOString(), end ? end.toISOString() : null, resolved.modo, resolved.legacy],
        );
        const next = mapearAcceso(updated.rows[0]);
        await historialRepository.insertarEvento({
          accesoId: id,
          tipoEvento: 'renovado',
          anterior: snapshot(access, currentModels),
          nuevo: snapshot(next, resolved.modelos),
          actorUsuarioId: actor,
          motivo: reason,
          metadata: null,
        }, client);
        return contextoFinal({ client, contextService: context, acceso: next, principal });
      }});
    },

    async revocarAcceso({ accesoId, actorUsuarioId, motivo, principal }) {
      return cambiarEstadoCiclo({ accesoId, estadoDestino: 'revocado', tipoEvento: 'revocado', actorUsuarioId, motivo, principal });
    },

    async cancelarAcceso({ accesoId, actorUsuarioId, motivo, principal }) {
      return cambiarEstadoCiclo({ accesoId, estadoDestino: 'cancelado', tipoEvento: 'cancelado', actorUsuarioId, motivo, principal });
    },

    async reactivarAcceso({ accesoId, fechaInicio, fechaFin, modelos, modoActivo, actorUsuarioId, motivo, principal }) {
      const id = validarId(accesoId, 'accesoId');
      return mutate({ actorUsuarioId, principal, motivo, callback: async ({ client, actor, reason }) => {
        const access = await leerAcceso(client, id, { forUpdate: true });
        if (!access) throw errorConCodigo('ACCESS_ADMIN_NOT_FOUND', 'Acceso no encontrado', 404);
        if (!['revocado', 'cancelado'].includes(access.estado)) {
          throw errorConCodigo('ACCESS_ADMIN_STATE', 'Solo se pueden reactivar estados terminales', 409);
        }
        const currentModels = await leerModelos(client, id, modelosRepository);
        validarAccesoCoherente(access, currentModels);
        const reference = new Date(clock());
        const existingDates = fechasAcceso(access);
        const hasNewDates = fechaInicio !== undefined || fechaFin !== undefined;
        let start = fechaInicio === undefined ? existingDates.inicio : fecha(fechaInicio, 'fechaInicio');
        let end = fechaFin === undefined ? existingDates.fin : fecha(fechaFin, 'fechaFin', { permitirNull: true });
        if (!esVigente(start, end, reference)) {
          if (!hasNewDates || fechaInicio === undefined || fechaFin === undefined) {
            throw errorConCodigo('ACCESS_ADMIN_INVALID_VALIDITY', 'La reactivación requiere una vigencia válida', 422);
          }
          start = fecha(fechaInicio, 'fechaInicio');
          end = fecha(fechaFin, 'fechaFin', { permitirNull: true });
          validarVigenciaOperativa(start, end, reference);
        } else {
          validarVigenciaOperativa(start, end, reference);
        }
        const resolved = resolverModelosYModo(currentModels, access.modo_activo, modelos, modoActivo);
        if (currentModels.length === 0) throw errorConCodigo('ACCESS_ADMIN_INVALID_MODELS', 'El acceso requiere modelos', 422);
        if (!resolved.modelos.length) throw errorConCodigo('ACCESS_ADMIN_INVALID_MODELS', 'El acceso requiere modelos', 422);
        const updated = await client.query(
          `UPDATE accesos_oposicion
              SET estado = $2, fecha_inicio = $3, fecha_fin = $4,
                  modo_activo = $5, modo_preparacion = $6, actualizada_en = NOW()
            WHERE id = $1
            RETURNING id, usuario_id, oposicion_id, estado, modo_preparacion, modo_activo,
                      fecha_inicio::TEXT AS fecha_inicio, fecha_fin::TEXT AS fecha_fin,
                      tipo_alumno, precio_pagado, notas, ranking_publico, creada_en, actualizada_en`,
          [id, resolved.estado, start.toISOString(), end ? end.toISOString() : null, resolved.modo, resolved.legacy],
        );
        const next = mapearAcceso(updated.rows[0]);
        if (JSON.stringify(currentModels) !== JSON.stringify(resolved.modelos)) {
          await modelosRepository.reemplazarModelos(id, resolved.modelos, client);
        }
        await historialRepository.insertarEvento({
          accesoId: id,
          tipoEvento: 'reactivado',
          anterior: snapshot(access, currentModels),
          nuevo: snapshot(next, resolved.modelos),
          actorUsuarioId: actor,
          motivo: reason,
          metadata: null,
        }, client);
        return contextoFinal({ client, contextService: context, acceso: next, principal });
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
