import { accesoOposicionModelosRepository } from '../repositories/accesoOposicionModelos.repository.js';
import { accesoOposicionHistorialRepository } from '../repositories/accesoOposicionHistorial.repository.js';

const MAX_BIGINT = 9223372036854775807n;
const MODOS = new Set(['experto', 'guiado']);

function errorConCodigo(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validarId(value, nombre) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value) && BigInt(value) <= MAX_BIGINT) return value;
  throw errorConCodigo('ACCESS_BILLING_INVALID_IDENTIFIER', `${nombre} inválido`);
}

function validarClient(client) {
  if (!client || typeof client.query !== 'function') {
    throw errorConCodigo('ACCESS_BILLING_INVALID_CLIENT', 'Se requiere el cliente de la transacción');
  }
}

function fecha(value, nombre) {
  const result = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(result.getTime())) throw errorConCodigo('ACCESS_BILLING_INVALID_VALIDITY', `${nombre} inválida`);
  return result;
}

function normalizarModelos(modelos, modoActivo) {
  if (!Array.isArray(modelos) || modelos.length === 0 || modelos.length > 2
    || modelos.some((modelo) => !MODOS.has(modelo))
    || new Set(modelos).size !== modelos.length) {
    throw errorConCodigo('ACCESS_BILLING_INVALID_MODELS', 'Modelos inválidos');
  }
  const ordenados = ['experto', 'guiado'].filter((modelo) => modelos.includes(modelo));
  const modo = modoActivo ?? (ordenados.length === 1 ? ordenados[0] : null);
  if (modo !== null && !MODOS.has(modo)) throw errorConCodigo('ACCESS_BILLING_INVALID_MODE', 'Modo inválido');
  if (modo !== null && !ordenados.includes(modo)) throw errorConCodigo('ACCESS_BILLING_INVALID_MODE', 'Modo no incluido');
  return { modelos: ordenados, modo, estado: modo === null ? 'pendiente_modo' : 'activo' };
}

function legacy(modo) {
  return modo === 'guiado' ? 'albacer' : 'experto';
}

function snapshot(access, modelos) {
  return {
    estado: access.estado,
    modoActivo: access.modo_activo,
    modelos: [...modelos],
    vigencia: { fechaInicio: access.fecha_inicio, fechaFin: access.fecha_fin },
  };
}

function compararFecha(actual, esperada) {
  return actual === null ? esperada === null : esperada !== null && new Date(actual).getTime() === esperada.getTime();
}

export function createAccessBillingService({ modelosRepository = accesoOposicionModelosRepository, historialRepository = accesoOposicionHistorialRepository, clock = () => new Date() } = {}) {
  return {
    async grantOrRenewAccessFromBilling({
      usuarioId,
      oposicionId,
      fechaInicio,
      fechaFin,
      precioPagado = null,
      notas = null,
      tipoAlumno = 'libre',
      modelos = ['guiado'],
      modoActivo,
      stripeEventId,
      client,
    } = {}) {
      validarClient(client);
      const userId = validarId(usuarioId, 'usuarioId');
      const oppositionId = validarId(oposicionId, 'oposicionId');
      if (typeof stripeEventId !== 'string' || stripeEventId.trim() === '') {
        throw errorConCodigo('ACCESS_BILLING_INVALID_EVENT', 'stripeEventId inválido');
      }
      const start = fecha(fechaInicio, 'fechaInicio');
      const end = fecha(fechaFin, 'fechaFin');
      if (end.getTime() <= start.getTime()) throw errorConCodigo('ACCESS_BILLING_INVALID_VALIDITY', 'fechaFin inválida');
      const now = new Date(clock());
      if (Number.isNaN(now.getTime()) || end.getTime() <= now.getTime()) {
        throw errorConCodigo('ACCESS_BILLING_INVALID_VALIDITY', 'La vigencia debe ser futura');
      }

      const existing = await client.query(
        `SELECT id, usuario_id, oposicion_id, estado, modo_preparacion, modo_activo,
                fecha_inicio::TEXT AS fecha_inicio, fecha_fin::TEXT AS fecha_fin,
                tipo_alumno, precio_pagado, notas
           FROM accesos_oposicion
          WHERE usuario_id = $1 AND oposicion_id = $2
          FOR UPDATE`,
        [userId, oppositionId],
      );

      const existingAccess = existing.rows[0] ?? null;
      if (existingAccess) {
        const duplicate = await client.query(
          `SELECT 1 FROM accesos_oposicion_historial
            WHERE acceso_id = $1
              AND tipo_evento IN ('creado', 'renovado')
              AND metadata->>'stripeEventId' = $2
            LIMIT 1`,
          [existingAccess.id, stripeEventId],
        );
        if (duplicate.rowCount > 0) return { accesoId: existingAccess.id, operacion: 'idempotente', idempotente: true };
      }

      if (existingAccess && ['revocado', 'cancelado'].includes(existingAccess.estado)) {
        throw errorConCodigo('ACCESS_BILLING_TERMINAL_STATE', 'No se puede reactivar un acceso terminal');
      }

      const currentModels = existingAccess
        ? (await modelosRepository.listarPorAcceso(existingAccess.id, client)).map((row) => row.modelo)
        : [];
      // El webhook usa ambos modelos para una concesión nueva. En una
      // renovación, conservar la elección canónica existente evita devolver
      // accidentalmente un acceso ya elegido a pendiente_modo.
      const conservarEleccion = existingAccess
        && Array.isArray(modelos)
        && modelos.length === 2
        && modelos.includes('experto')
        && modelos.includes('guiado')
        && modoActivo === null;
      const resolved = normalizarModelos(
        conservarEleccion ? currentModels : modelos,
        conservarEleccion ? existingAccess.modo_activo : modoActivo,
      );
      const effectiveExpired = existingAccess
        && existingAccess.estado === 'activo'
        && existingAccess.fecha_fin !== null
        && new Date(existingAccess.fecha_fin) <= now;
      const operation = existingAccess ? 'renovacion' : 'concesion';
      const nextState = resolved.estado;
      const nextLegacy = legacy(resolved.modo ?? resolved.modelos[0]);

      if (!existingAccess) {
        const inserted = await client.query(
          `INSERT INTO accesos_oposicion
             (usuario_id, oposicion_id, estado, fecha_inicio, fecha_fin, precio_pagado,
              notas, tipo_alumno, modo_preparacion, modo_activo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, usuario_id, oposicion_id, estado, modo_preparacion, modo_activo,
                     fecha_inicio::TEXT AS fecha_inicio, fecha_fin::TEXT AS fecha_fin,
                     tipo_alumno, precio_pagado, notas`,
          [userId, oppositionId, nextState, start.toISOString(), end.toISOString(), precioPagado, notas, tipoAlumno, nextLegacy, resolved.modo],
        );
        const access = inserted.rows[0];
        for (const modelo of resolved.modelos) await modelosRepository.insertarModelo(access.id, modelo, client);
        await historialRepository.insertarEvento({
          accesoId: access.id,
          tipoEvento: 'acceso_creado',
          anterior: null,
          nuevo: snapshot(access, resolved.modelos),
          actorUsuarioId: null,
          motivo: null,
          metadata: { tipoActor: 'sistema', origen: 'stripe', stripeEventId, operacion: operation },
        }, client);
        return { accesoId: access.id, operacion: operation, idempotente: false };
      }

      const unchanged = !effectiveExpired
        && existingAccess.estado === nextState
        && existingAccess.modo_activo === resolved.modo
        && existingAccess.modo_preparacion === nextLegacy
        && existingAccess.tipo_alumno === tipoAlumno
        && String(existingAccess.precio_pagado ?? '') === String(precioPagado ?? '')
        && (existingAccess.notas ?? null) === (notas ?? null)
        && compararFecha(existingAccess.fecha_inicio, start)
        && compararFecha(existingAccess.fecha_fin, end)
        && JSON.stringify(currentModels) === JSON.stringify(resolved.modelos);
      if (unchanged) return { accesoId: existingAccess.id, operacion: 'idempotente', idempotente: true };

      if (JSON.stringify(currentModels) !== JSON.stringify(resolved.modelos)) {
        await modelosRepository.reemplazarModelos(existingAccess.id, resolved.modelos, client);
      }
      const updated = await client.query(
        `UPDATE accesos_oposicion
            SET estado = $2, fecha_inicio = $3, fecha_fin = $4, precio_pagado = $5,
                notas = $6, tipo_alumno = $7, modo_preparacion = $8, modo_activo = $9,
                actualizada_en = NOW()
          WHERE id = $1
          RETURNING id, usuario_id, oposicion_id, estado, modo_preparacion, modo_activo,
                    fecha_inicio::TEXT AS fecha_inicio, fecha_fin::TEXT AS fecha_fin,
                    tipo_alumno, precio_pagado, notas`,
        [existingAccess.id, nextState, start.toISOString(), end.toISOString(), precioPagado, notas, tipoAlumno, nextLegacy, resolved.modo],
      );
      const access = updated.rows[0];
      await historialRepository.insertarEvento({
        accesoId: access.id,
        tipoEvento: 'renovado',
        anterior: snapshot(existingAccess, currentModels),
        nuevo: snapshot(access, resolved.modelos),
        actorUsuarioId: null,
        motivo: null,
        metadata: { tipoActor: 'sistema', origen: 'stripe', stripeEventId, operacion: 'renovacion' },
      }, client);
      return { accesoId: access.id, operacion: 'renovacion', idempotente: false };
    },
  };
}

export const accessBillingService = createAccessBillingService();
