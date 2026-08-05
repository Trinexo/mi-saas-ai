import pool from '../config/db.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { accesoOposicionModelosRepository } from '../repositories/accesoOposicionModelos.repository.js';
import { accesoOposicionHistorialRepository } from '../repositories/accesoOposicionHistorial.repository.js';
import { createAccessContextService } from './accessContext.service.js';

const MAX_BIGINT = 9223372036854775807n;
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MODOS = new Set(['experto', 'guiado']);
const ESTADOS_CAMBIABLES = new Set(['activo', 'pendiente_modo']);

function errorConCodigo(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizarId(value, nombre) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    const bigint = BigInt(value);
    if (bigint <= MAX_BIGINT) return bigint > MAX_SAFE_BIGINT ? value : Number(value);
  }
  throw errorConCodigo('ACCESS_MODE_INVALID_IDENTIFIER', `${nombre} inválido`);
}

function validarModo(modo) {
  if (!MODOS.has(modo)) {
    throw errorConCodigo('ACCESS_MODE_INVALID_MODE', 'Modo inválido');
  }
  return modo;
}

function normalizarFecha(value, nombre) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string' || value.trim() === '') {
    throw errorConCodigo('ACCESS_MODE_INCONSISTENT', `${nombre} inválida`);
  }
  const parsed = new Date(`${value.trim().replace(' ', 'T')}Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw errorConCodigo('ACCESS_MODE_INCONSISTENT', `${nombre} inválida`);
  }
  return parsed;
}

function validarCoherencia(acceso, modelos, ahora) {
  if (!ESTADOS_CAMBIABLES.has(acceso.estado)) {
    throw errorConCodigo('ACCESS_MODE_STATE_FORBIDDEN', 'Estado no elegible');
  }
  if (!Array.isArray(modelos) || modelos.length === 0
    || modelos.some((modelo) => !MODOS.has(modelo))
    || new Set(modelos).size !== modelos.length) {
    throw errorConCodigo('ACCESS_MODE_INCONSISTENT', 'Modelos del acceso incoherentes');
  }
  if (acceso.estado === 'activo' && (!MODOS.has(acceso.modo_activo)
    || !modelos.includes(acceso.modo_activo))) {
    throw errorConCodigo('ACCESS_MODE_INCONSISTENT', 'Modo activo incoherente');
  }
  if (acceso.estado === 'pendiente_modo' && acceso.modo_activo !== null) {
    throw errorConCodigo('ACCESS_MODE_INCONSISTENT', 'Pendiente de modo incoherente');
  }
  const inicio = normalizarFecha(acceso.fecha_inicio, 'fecha_inicio');
  const fin = normalizarFecha(acceso.fecha_fin, 'fecha_fin');
  if (inicio && inicio.getTime() > ahora.getTime()) {
    throw errorConCodigo('ACCESS_MODE_STATE_FORBIDDEN', 'Acceso todavía no vigente');
  }
  if (fin && fin.getTime() <= ahora.getTime()) {
    throw errorConCodigo('ACCESS_MODE_STATE_FORBIDDEN', 'Acceso expirado');
  }
  return { inicio, fin };
}

function snapshot(acceso, modelos, vigencia) {
  return {
    estado: acceso.estado,
    modoActivo: acceso.modo_activo,
    modelos: [...modelos],
    vigencia: {
      fechaInicio: vigencia.inicio?.toISOString() ?? null,
      fechaFin: vigencia.fin?.toISOString() ?? null,
    },
  };
}

export function createAccessModeService({
  db = pool,
  accesoRepository = accesoOposicionRepository,
  modelosRepository = accesoOposicionModelosRepository,
  historialRepository = accesoOposicionHistorialRepository,
  contextoService = null,
  clock = () => new Date(),
} = {}) {
  return {
    async cambiarModoActivo({ accesoId, usuarioId, modo, actorUsuarioId = usuarioId } = {}) {
      const normalizedAccesoId = normalizarId(accesoId, 'accesoId');
      const normalizedUsuarioId = normalizarId(usuarioId, 'usuarioId');
      const normalizedActorId = normalizarId(actorUsuarioId, 'actorUsuarioId');
      const requestedMode = validarModo(modo);
      const client = await db.connect();
      let transactionStarted = false;
      try {
        await client.query('BEGIN');
        transactionStarted = true;
        const context = contextoService ?? createAccessContextService({ db: client, clock });
        const acceso = await accesoRepository.obtenerParaCambioModo(normalizedAccesoId, client);
        if (!acceso || BigInt(acceso.usuario_id) !== BigInt(normalizedUsuarioId)) {
          throw errorConCodigo('ACCESS_MODE_FORBIDDEN', 'Acceso no disponible');
        }
        const modelosRows = await modelosRepository.listarPorAcceso(normalizedAccesoId, client);
        const modelos = modelosRows.map((row) => row.modelo);
        const beforeContext = await context.obtenerContextoUsuario({
          usuarioId: normalizedUsuarioId,
          oposicionId: acceso.oposicion_id,
          principal: { tipo: 'alumno', usuarioId: normalizedUsuarioId },
        });
        if (acceso.estado === 'activo'
          && (beforeContext.estado_efectivo !== 'activo' || !beforeContext.vigencia.esta_vigente)) {
          throw errorConCodigo('ACCESS_MODE_STATE_FORBIDDEN', 'Acceso no vigente');
        }
        const ahora = new Date(clock());
        if (Number.isNaN(ahora.getTime())) {
          throw errorConCodigo('ACCESS_MODE_INCONSISTENT', 'Instante de referencia inválido');
        }
        const vigencia = validarCoherencia(acceso, modelos, ahora);
        if (!modelos.includes(requestedMode)) {
          throw errorConCodigo('ACCESS_MODE_NOT_INCLUDED', 'Modo no incluido');
        }

        if (acceso.estado === 'activo' && acceso.modo_activo === requestedMode) {
          const result = await context.obtenerContextoUsuario({
            usuarioId: normalizedUsuarioId,
            oposicionId: acceso.oposicion_id,
            principal: { tipo: 'alumno', usuarioId: normalizedUsuarioId },
          });
          await client.query('COMMIT');
          transactionStarted = false;
          return result;
        }

        const nuevoEstado = acceso.estado === 'pendiente_modo' ? 'activo' : acceso.estado;
        const nuevoAcceso = {
          ...acceso,
          estado: nuevoEstado,
          modo_activo: requestedMode,
          modo_preparacion: requestedMode === 'experto' ? 'experto' : 'albacer',
        };
        const anterior = snapshot(acceso, modelos, vigencia);
        const nuevo = snapshot(nuevoAcceso, modelos, vigencia);
        await client.query(
          `UPDATE accesos_oposicion
              SET estado = $2,
                  modo_activo = $3,
                  modo_preparacion = $4,
                  actualizada_en = NOW()
            WHERE id = $1`,
          [normalizedAccesoId, nuevoEstado, requestedMode, nuevoAcceso.modo_preparacion],
        );
        await historialRepository.insertarEvento({
          accesoId: normalizedAccesoId,
          tipoEvento: 'modo_activo_cambiado',
          anterior,
          nuevo,
          actorUsuarioId: normalizedActorId,
          motivo: null,
          metadata: null,
        }, client);
        const result = await context.obtenerContextoUsuario({
          usuarioId: normalizedUsuarioId,
          oposicionId: acceso.oposicion_id,
          principal: { tipo: 'alumno', usuarioId: normalizedUsuarioId },
        });
        await client.query('COMMIT');
        transactionStarted = false;
        return result;
      } catch (error) {
        if (transactionStarted) await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

export const accessModeService = createAccessModeService();
