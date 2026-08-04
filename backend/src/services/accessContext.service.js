import pool from '../config/db.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';

const MAX_BIGINT = 9223372036854775807n;
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MODELOS = new Set(['experto', 'guiado']);
const TIPOS_PRINCIPAL = new Set(['alumno', 'profesor', 'administrador', 'billing']);
const BILLING_SCOPES = Object.freeze({
  renovar: 'access:renew',
  modificarModelos: 'access:modify-models',
  modificarVigencia: 'access:modify-validity',
  revocar: 'access:revoke',
  cancelar: 'access:cancel',
  reactivar: 'access:reactivate',
});
const ACCIONES = Object.freeze([
  'puede_renovar',
  'puede_modificar_modelos',
  'puede_modificar_vigencia',
  'puede_revocar',
  'puede_cancelar',
  'puede_reactivar',
]);

function errorConCodigo(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validarId(value, nombre) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    const bigint = BigInt(value);
    if (bigint <= MAX_BIGINT) return value;
  }
  throw errorConCodigo('ACCESS_CONTEXT_INVALID_IDENTIFIER', `${nombre} no es válido`);
}

function normalizarId(value, nombre) {
  const validado = validarId(value, nombre);
  return typeof validado === 'string' && BigInt(validado) > MAX_SAFE_BIGINT
    ? validado
    : Number(validado);
}

function normalizarPrincipal(principal, usuarioId) {
  const value = principal ?? { tipo: 'alumno', usuarioId };
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || !TIPOS_PRINCIPAL.has(value.tipo)) {
    throw errorConCodigo('ACCESS_CONTEXT_INVALID_PRINCIPAL', 'Principal inválido');
  }
  if (value.usuarioId !== undefined) validarId(value.usuarioId, 'principal.usuarioId');
  if (value.tipo === 'alumno') {
    if (value.usuarioId === undefined || BigInt(value.usuarioId) !== BigInt(usuarioId)) {
      throw errorConCodigo('ACCESS_CONTEXT_INVALID_PRINCIPAL', 'Principal alumno no coincide');
    }
  }
  if (value.scopes !== undefined && (!Array.isArray(value.scopes)
    || value.scopes.some((scope) => typeof scope !== 'string' || scope.trim() === ''))) {
    throw errorConCodigo('ACCESS_CONTEXT_INVALID_PRINCIPAL', 'Scopes inválidos');
  }
  return { ...value, scopes: value.scopes ?? [] };
}

function normalizarLegacy(value) {
  if (value === null || value === undefined) return null;
  if (value === 'experto') return 'experto';
  if (value === 'albacer') return 'guiado';
  throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', 'modo_preparacion desconocido');
}

function fechaUtc(value, nombre) {
  if (value === null) return null;
  if (typeof value !== 'string' || value.trim() === '') {
    throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', `${nombre} inválida`);
  }
  const iso = `${value.trim().replace(' ', 'T')}Z`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', `${nombre} inválida`);
  }
  return parsed;
}

function accionesVacias() {
  return Object.fromEntries(ACCIONES.map((accion) => [accion, false]));
}

function permisosVacios() {
  return {
    puede_acceder_contenido: false,
    puede_usar_experto: false,
    puede_usar_guiado: false,
    puede_cambiar_modo: false,
  };
}

function dtoSinAcceso(usuarioId, oposicionId) {
  return {
    usuario_id: usuarioId,
    oposicion_id: oposicionId,
    tiene_acceso: false,
    acceso_id: null,
    estado: null,
    estado_efectivo: 'sin_acceso',
    vigencia: { fecha_inicio: null, fecha_fin: null, esta_vigente: false, dias_restantes: null },
    modelos_disponibles: [],
    modo_activo: null,
    permisos: permisosVacios(),
    acciones_administrativas: accionesVacias(),
    legacy: { modo_preparacion: null, modo_preparacion_normalizado: null },
  };
}

function accionesPara(estado, principal) {
  const acciones = accionesVacias();
  if (principal.tipo === 'administrador') {
    if (estado === 'activo' || estado === 'expirado' || estado === 'pendiente_modo') {
      acciones.puede_modificar_modelos = true;
      acciones.puede_modificar_vigencia = true;
      acciones.puede_revocar = true;
      acciones.puede_cancelar = true;
      acciones.puede_renovar = estado === 'expirado';
    } else if (estado === 'revocado' || estado === 'cancelado') {
      acciones.puede_reactivar = true;
    }
  } else if (principal.tipo === 'billing') {
    const scopes = new Set(principal.scopes);
    const allowed = (scope) => scopes.has(scope);
    if (estado === 'expirado') acciones.puede_renovar = allowed(BILLING_SCOPES.renovar);
    if (estado === 'activo' || estado === 'expirado' || estado === 'pendiente_modo') {
      acciones.puede_modificar_modelos = allowed(BILLING_SCOPES.modificarModelos);
      acciones.puede_modificar_vigencia = allowed(BILLING_SCOPES.modificarVigencia);
      acciones.puede_revocar = allowed(BILLING_SCOPES.revocar);
      acciones.puede_cancelar = allowed(BILLING_SCOPES.cancelar);
    }
    if (estado === 'revocado' || estado === 'cancelado') {
      acciones.puede_reactivar = allowed(BILLING_SCOPES.reactivar);
    }
  }
  return acciones;
}

function construirContexto(row, principal, usuarioId, oposicionId, clock) {
  const accesoId = normalizarId(row.acceso_id, 'acceso_id');
  if (!['pendiente_modo', 'activo', 'expirado', 'revocado', 'cancelado'].includes(row.estado)) {
    throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', 'estado inválido');
  }
  if (!Array.isArray(row.modelos) || row.modelos.length === 0) {
    throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', 'El acceso no tiene modelos');
  }
  const modelos = [];
  for (const modelo of row.modelos) {
    if (!MODELOS.has(modelo) || modelos.includes(modelo)) {
      throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', 'Modelos inválidos');
    }
    modelos.push(modelo);
  }
  modelos.sort((left, right) => (left === 'experto' ? 0 : 1) - (right === 'experto' ? 0 : 1));
  const legacyNormalizado = normalizarLegacy(row.modo_preparacion);
  if (legacyNormalizado !== null && !modelos.includes(legacyNormalizado)) {
    throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', 'Legacy no incluido');
  }
  if (modelos.length === 1 && legacyNormalizado !== null && legacyNormalizado !== row.modo_activo) {
    throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', 'Discrepancia legacy');
  }
  if (row.modo_activo !== null && (!MODELOS.has(row.modo_activo) || !modelos.includes(row.modo_activo))) {
    throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', 'modo_activo no incluido');
  }
  if (row.estado === 'activo' && row.modo_activo === null) {
    throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', 'Activo sin modo_activo');
  }
  if (row.estado === 'pendiente_modo' && (modelos.length < 2 || row.modo_activo !== null)) {
    throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', 'pendiente_modo inválido');
  }
  const inicio = fechaUtc(row.fecha_inicio, 'fecha_inicio');
  const fin = fechaUtc(row.fecha_fin, 'fecha_fin');
  const referencia = new Date(clock());
  if (Number.isNaN(referencia.getTime())) {
    throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', 'Instante de referencia inválido');
  }
  const expirado = row.estado === 'activo' && fin !== null && fin.getTime() <= referencia.getTime();
  const estadoEfectivo = expirado ? 'expirado' : row.estado;
  const estaVigente = estadoEfectivo === 'activo'
    && inicio.getTime() <= referencia.getTime()
    && (fin === null || fin.getTime() > referencia.getTime());
  const diasRestantes = fin === null
    ? null
    : Math.max(0, Math.ceil((fin.getTime() - referencia.getTime()) / 86400000));
  const permisos = permisosVacios();
  if (principal.tipo === 'alumno' && estaVigente) {
    permisos.puede_acceder_contenido = true;
    permisos.puede_usar_experto = modelos.includes('experto');
    permisos.puede_usar_guiado = modelos.includes('guiado');
    permisos.puede_cambiar_modo = modelos.length > 1 || estadoEfectivo === 'pendiente_modo';
  }
  return {
    usuario_id: usuarioId,
    oposicion_id: oposicionId,
    tiene_acceso: true,
    acceso_id: accesoId,
    estado: row.estado,
    estado_efectivo: estadoEfectivo,
    vigencia: {
      fecha_inicio: inicio.toISOString(),
      fecha_fin: fin?.toISOString() ?? null,
      esta_vigente: estaVigente,
      dias_restantes: diasRestantes,
    },
    modelos_disponibles: modelos,
    modo_activo: row.modo_activo,
    permisos,
    acciones_administrativas: accionesPara(estadoEfectivo, principal),
    legacy: {
      modo_preparacion: row.modo_preparacion,
      modo_preparacion_normalizado: legacyNormalizado,
    },
  };
}

export function createAccessContextService({ db = pool, accesoRepository = accesoOposicionRepository, clock = () => new Date() } = {}) {
  return {
    async obtenerContextoUsuario({ usuarioId, oposicionId, principal } = {}) {
      const normalizedUsuarioId = normalizarId(usuarioId, 'usuarioId');
      const normalizedOposicionId = normalizarId(oposicionId, 'oposicionId');
      const normalizedPrincipal = normalizarPrincipal(principal, normalizedUsuarioId);
      let rows;
      try {
        rows = await accesoRepository.obtenerLecturaContexto(
          normalizedUsuarioId,
          normalizedOposicionId,
          db,
        );
      } catch (error) {
        if (error.code?.startsWith('ACCESS_CONTEXT_')) throw error;
        throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', 'No se pudo leer el contexto');
      }
      if (!Array.isArray(rows) || rows.length !== 1) {
        throw errorConCodigo('ACCESS_CONTEXT_INCONSISTENT', 'Lectura ambigua del acceso');
      }
      const row = rows[0];
      if (!row.usuario_existe) {
        throw errorConCodigo('ACCESS_CONTEXT_USER_NOT_FOUND', 'Usuario no encontrado');
      }
      if (!row.oposicion_existe) {
        throw errorConCodigo('ACCESS_CONTEXT_OPPOSITION_NOT_FOUND', 'Oposición no encontrada');
      }
      if (row.acceso_id === null) return dtoSinAcceso(normalizedUsuarioId, normalizedOposicionId);
      return construirContexto(row, normalizedPrincipal, normalizedUsuarioId, normalizedOposicionId, clock);
    },
  };
}

export const accessContextService = createAccessContextService();
