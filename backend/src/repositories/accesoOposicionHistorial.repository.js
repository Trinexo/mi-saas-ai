import pool from '../config/db.js';

const EVENTOS_ADMINISTRATIVOS = new Set([
  'acceso_creado',
  'modelos_modificados',
  'vigencia_modificada',
  'renovado',
  'revocado',
  'cancelado',
  'reactivado',
]);
const EVENTOS_CANONICOS = new Set([
  ...EVENTOS_ADMINISTRATIVOS,
  'modo_activo_cambiado',
  'expirado',
]);
const ESCRITURA_EVENTOS = Object.freeze({
  acceso_creado: 'creado',
  modelos_modificados: 'modelos_actualizados',
  vigencia_modificada: 'vigencia_actualizada',
});
const LECTURA_EVENTOS = Object.freeze(Object.fromEntries(
  Object.entries(ESCRITURA_EVENTOS).map(([canonico, persistido]) => [persistido, canonico]),
));
const EVENTOS_PERSISTIDOS_LEGACY = new Set([
  'migracion_legacy',
  ...Object.values(ESCRITURA_EVENTOS),
]);
const ESTADOS_PERMITIDOS = new Set([
  'pendiente_modo', 'activo', 'expirado', 'revocado', 'cancelado',
]);
const CAMPOS_SNAPSHOT = new Set(['estado', 'modoActivo', 'modelos', 'vigencia']);
const MAX_BIGINT = 9223372036854775807n;
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

function validarId(id, nombre) {
  if (typeof id === 'number'
    && Number.isSafeInteger(id)
    && id > 0) return id;
  if (typeof id === 'string'
    && /^[1-9]\d*$/.test(id)
    && BigInt(id) <= MAX_BIGINT) return id;
  throw new TypeError(`${nombre} debe ser un entero positivo`);
}

function normalizarIdDevuelto(id, nombre, { permitirNull = false } = {}) {
  if (permitirNull && (id === null || id === undefined)) return null;
  if (typeof id === 'number' && Number.isSafeInteger(id) && id > 0) return id;
  if (typeof id === 'string' && /^[1-9]\d*$/.test(id)) {
    const bigint = BigInt(id);
    if (bigint <= MAX_BIGINT) return bigint <= MAX_SAFE_BIGINT ? Number(id) : id;
  }
  if (id === null || id === undefined) {
    throw new TypeError(`${nombre} no puede ser nulo`);
  }
  throw new TypeError(`${nombre} debe ser un entero positivo seguro`);
}

function validarClient(client) {
  if (!client || typeof client.query !== 'function') {
    throw new TypeError('Se requiere un cliente PostgreSQL válido');
  }
}

function validarObjeto(value, nombre, { permitirNull = true } = {}) {
  if (value === null && permitirNull) return;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${nombre} debe ser un objeto o null`);
  }
}

function validarModeloArray(modelos, nombre) {
  if (modelos === undefined || modelos === null) return;
  if (!Array.isArray(modelos)) throw new TypeError(`${nombre}.modelos debe ser un array`);
  const vistos = new Set();
  for (const modelo of modelos) {
    if (!['experto', 'guiado'].includes(modelo)) {
      throw new TypeError(`${nombre}.modelos contiene un modelo no canónico`);
    }
    if (vistos.has(modelo)) throw new TypeError(`${nombre}.modelos contiene duplicados`);
    vistos.add(modelo);
  }
}

function validarSnapshot(snapshot, nombre) {
  validarObjeto(snapshot, nombre);
  if (snapshot === null) return;
  for (const campo of Object.keys(snapshot)) {
    if (!CAMPOS_SNAPSHOT.has(campo)) {
      throw new TypeError(`${nombre} contiene un campo desconocido: ${campo}`);
    }
  }
  if (Object.keys(snapshot).length === 0) {
    throw new TypeError(`${nombre} no puede ser un objeto vacío`);
  }
  if (snapshot.estado !== undefined && snapshot.estado !== null && !ESTADOS_PERMITIDOS.has(snapshot.estado)) {
    throw new TypeError(`${nombre}.estado no es válido`);
  }
  if (snapshot.modoActivo !== undefined && snapshot.modoActivo !== null
    && !['experto', 'guiado'].includes(snapshot.modoActivo)) {
    throw new TypeError(`${nombre}.modoActivo no es canónico`);
  }
  validarModeloArray(snapshot.modelos, nombre);
  if (snapshot.vigencia !== undefined && snapshot.vigencia !== null) {
    validarObjeto(snapshot.vigencia, `${nombre}.vigencia`, { permitirNull: false });
  }
}

function validarMetadata(metadata, { obligatoria = false } = {}) {
  validarObjeto(metadata, 'metadata');
  if (metadata === null) {
    if (obligatoria) throw new TypeError('metadata es obligatoria');
    return null;
  }
  if (Object.keys(metadata).length === 0 && obligatoria) {
    throw new TypeError('metadata no puede estar vacía');
  }
  if (Object.prototype.hasOwnProperty.call(metadata, 'vigencia')) {
    throw new TypeError('metadata.vigencia está reservada para el repositorio');
  }
  const serializada = JSON.stringify(metadata);
  if (/https?:\/\/|postgres(?:ql)?:\/\//i.test(serializada)
    || /password|secret|token|api[_-]?key/i.test(serializada)) {
    throw new TypeError('metadata contiene información no permitida');
  }
  return metadata;
}

function validarEvento({ accesoId, tipoEvento, anterior, nuevo, actorUsuarioId, motivo, metadata }) {
  validarId(accesoId, 'accesoId');
  if (!EVENTOS_CANONICOS.has(tipoEvento)) {
    throw new TypeError('tipoEvento no pertenece al catálogo canónico');
  }
  validarSnapshot(anterior, 'anterior');
  validarSnapshot(nuevo, 'nuevo');
  if (tipoEvento === 'acceso_creado') {
    if (anterior !== null || nuevo === null) {
      throw new TypeError('acceso_creado requiere anterior null y nuevo completo');
    }
  } else if (anterior === null || nuevo === null) {
    throw new TypeError(`${tipoEvento} requiere snapshots anterior y nuevo`);
  }

  if (tipoEvento === 'expirado') {
    if (actorUsuarioId !== null && actorUsuarioId !== undefined) {
      throw new TypeError('expirado debe tener actorUsuario_id null');
    }
    if (!metadata || metadata.origen !== 'sistema') {
      throw new TypeError('expirado requiere metadata con origen sistema');
    }
    validarMetadata(metadata, { obligatoria: true });
    return;
  }

  if (actorUsuarioId !== null && actorUsuarioId !== undefined) {
    validarId(actorUsuarioId, 'actorUsuarioId');
  } else {
    throw new TypeError('El evento requiere actorUsuarioId');
  }

  const motivoObligatorio = EVENTOS_ADMINISTRATIVOS.has(tipoEvento);
  if (motivoObligatorio || (tipoEvento === 'modo_activo_cambiado' && motivo !== undefined && motivo !== null)) {
    if (typeof motivo !== 'string' || motivo.trim() === '') {
      throw new TypeError('El evento requiere un motivo no vacío');
    }
  }
  validarMetadata(metadata);
}

function normalizarMotivo(tipoEvento, motivo) {
  if (motivo === undefined || motivo === null) {
    if (EVENTOS_ADMINISTRATIVOS.has(tipoEvento)) {
      throw new TypeError('El evento requiere un motivo no vacío');
    }
    return null;
  }
  if (typeof motivo !== 'string' || motivo.trim() === '') {
    throw new TypeError('El evento requiere un motivo no vacío');
  }
  return motivo.trim();
}

function ordenarModelos(modelos) {
  if (modelos === null || modelos === undefined) return null;
  return ['experto', 'guiado'].filter((modelo) => modelos.includes(modelo));
}

function mapearTipoEventoPersistido(tipoEvento) {
  if (LECTURA_EVENTOS[tipoEvento]) return LECTURA_EVENTOS[tipoEvento];
  if (EVENTOS_PERSISTIDOS_LEGACY.has(tipoEvento)) return tipoEvento;
  return tipoEvento;
}

function snapshotToColumns(snapshot) {
  if (snapshot === null) {
    return {
      estado: null,
      modoActivo: null,
      modelos: null,
      vigencia: null,
    };
  }
  return {
    estado: snapshot.estado ?? null,
    modoActivo: snapshot.modoActivo ?? null,
    modelos: snapshot.modelos === undefined ? null : ordenarModelos(snapshot.modelos),
    vigencia: snapshot.vigencia ?? null,
  };
}

function buildMetadata(metadata, anterior, nuevo) {
  const result = metadata ? { ...metadata } : null;
  const vigencias = {};
  if (anterior?.vigencia !== undefined) vigencias.anterior = anterior.vigencia;
  if (nuevo?.vigencia !== undefined) vigencias.nuevo = nuevo.vigencia;
  if (Object.keys(vigencias).length === 0) return result;
  return { ...(result ?? {}), vigencia: vigencias };
}

function mapearEvento(row) {
  const metadata = row.metadata === null ? null : { ...row.metadata };
  const vigenciaInterna = metadata?.vigencia;
  if (metadata) delete metadata.vigencia;
  const anterior = row.estado_anterior === null && row.modo_activo_anterior === null
    && row.modelos_anteriores === null && vigenciaInterna?.anterior === undefined ? null : {
      estado: row.estado_anterior,
      modoActivo: row.modo_activo_anterior,
      modelos: row.modelos_anteriores === null ? null : ordenarModelos(row.modelos_anteriores),
    };
  if (anterior && vigenciaInterna?.anterior !== undefined) anterior.vigencia = vigenciaInterna.anterior;
  const nuevo = row.estado_nuevo === null && row.modo_activo_nuevo === null
    && row.modelos_nuevos === null && vigenciaInterna?.nuevo === undefined ? null : {
      estado: row.estado_nuevo,
      modoActivo: row.modo_activo_nuevo,
      modelos: row.modelos_nuevos === null ? null : ordenarModelos(row.modelos_nuevos),
    };
  if (nuevo && vigenciaInterna?.nuevo !== undefined) nuevo.vigencia = vigenciaInterna.nuevo;
  return {
    id: normalizarIdDevuelto(row.id, 'id'),
    accesoId: normalizarIdDevuelto(row.acceso_id, 'accesoId'),
    tipoEvento: mapearTipoEventoPersistido(row.tipo_evento),
    anterior,
    nuevo,
    actorUsuarioId: normalizarIdDevuelto(row.actor_usuario_id, 'actorUsuarioId', { permitirNull: true }),
    motivo: row.motivo,
    metadata,
    creadoEn: row.creado_en,
  };
}

export const accesoOposicionHistorialRepository = {
  eventosCanonicos: Object.freeze([...EVENTOS_CANONICOS]),

  async insertarEvento(evento, client = pool) {
    validarClient(client);
    if (evento?.tipoEvento === 'migracion_legacy') {
      throw new TypeError('migracion_legacy solo puede leerse');
    }
    validarEvento(evento ?? {});
    const anterior = snapshotToColumns(evento.anterior ?? null);
    const nuevo = snapshotToColumns(evento.nuevo ?? null);
    const metadata = buildMetadata(evento.metadata ?? null, evento.anterior, evento.nuevo);
    const tipoPersistido = ESCRITURA_EVENTOS[evento.tipoEvento] ?? evento.tipoEvento;
    const motivo = normalizarMotivo(evento.tipoEvento, evento.motivo);
    const result = await client.query(
      `INSERT INTO accesos_oposicion_historial
        (acceso_id, tipo_evento, estado_anterior, estado_nuevo,
         modo_activo_anterior, modo_activo_nuevo, modelos_anteriores,
         modelos_nuevos, actor_usuario_id, motivo, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11::jsonb)
       RETURNING id, acceso_id, tipo_evento, estado_anterior, estado_nuevo,
         modo_activo_anterior, modo_activo_nuevo, modelos_anteriores,
         modelos_nuevos, actor_usuario_id, motivo, metadata, creado_en`,
      [
        evento.accesoId,
        tipoPersistido,
        anterior.estado,
        nuevo.estado,
        anterior.modoActivo,
        nuevo.modoActivo,
        anterior.modelos === null ? null : JSON.stringify(anterior.modelos),
        nuevo.modelos === null ? null : JSON.stringify(nuevo.modelos),
        evento.actorUsuarioId ?? null,
        motivo,
        metadata === null ? null : JSON.stringify(metadata),
      ],
    );
    return mapearEvento(result.rows[0]);
  },

  async listarPorAcceso(accesoId, client = pool) {
    validarId(accesoId, 'accesoId');
    validarClient(client);
    const result = await client.query(
      `SELECT id, acceso_id, tipo_evento, estado_anterior, estado_nuevo,
              modo_activo_anterior, modo_activo_nuevo, modelos_anteriores,
              modelos_nuevos, actor_usuario_id, motivo, metadata, creado_en
         FROM accesos_oposicion_historial
        WHERE acceso_id = $1
        ORDER BY creado_en ASC, id ASC`,
      [accesoId],
    );
    return result.rows.map(mapearEvento);
  },
};

// Una futura migración 041 podría unificar los nombres persistidos del catálogo.
