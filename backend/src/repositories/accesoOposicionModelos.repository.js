import pool from '../config/db.js';

const MODELOS_CANONICOS = Object.freeze(['experto', 'guiado']);
const MODELO_SET = new Set(MODELOS_CANONICOS);
const MAX_BIGINT = 9223372036854775807n;
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

function validarAccesoId(accesoId) {
  if (typeof accesoId === 'number'
    && Number.isSafeInteger(accesoId)
    && accesoId > 0) return accesoId;
  if (typeof accesoId === 'string'
    && /^[1-9]\d*$/.test(accesoId)
    && BigInt(accesoId) <= MAX_BIGINT) return accesoId;
  throw new TypeError('accesoId debe ser un entero positivo');
}

function normalizarIdDevuelto(id, nombre) {
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

function mapearModelo(row) {
  return {
    id: normalizarIdDevuelto(row.id, 'id'),
    accesoId: normalizarIdDevuelto(row.acceso_id, 'accesoId'),
    modelo: row.modelo,
    creadoEn: row.creado_en,
  };
}

function validarModelo(modelo) {
  if (typeof modelo !== 'string' || !MODELO_SET.has(modelo)) {
    throw new TypeError('modelo debe ser exactamente experto o guiado');
  }
  return modelo;
}

function normalizarModelos(modelos) {
  if (!Array.isArray(modelos) || modelos.length === 0) {
    throw new TypeError('modelos debe ser un array no vacío');
  }

  const vistos = new Set();
  for (const modelo of modelos) {
    validarModelo(modelo);
    if (vistos.has(modelo)) {
      throw new TypeError('modelos no puede contener duplicados');
    }
    vistos.add(modelo);
  }

  return MODELOS_CANONICOS.filter((modelo) => vistos.has(modelo));
}

function validarClient(client) {
  if (!client || typeof client.query !== 'function') {
    throw new TypeError('Se requiere un cliente PostgreSQL válido');
  }
}

async function listarFilas(accesoId, client = pool) {
  validarAccesoId(accesoId);
  validarClient(client);
  const result = await client.query(
    `SELECT id, acceso_id, modelo, creado_en
       FROM acceso_oposicion_modelos
      WHERE acceso_id = $1
      ORDER BY CASE modelo WHEN 'experto' THEN 1 WHEN 'guiado' THEN 2 END, id`,
    [accesoId],
  );
  return result.rows;
}

export const accesoOposicionModelosRepository = {
  modelosCanonicos: MODELOS_CANONICOS,

  normalizarModelos(modelos) {
    return normalizarModelos(modelos);
  },

  async listarPorAcceso(accesoId, client = pool) {
    return (await listarFilas(accesoId, client)).map(mapearModelo);
  },

  async tieneModelo(accesoId, modelo, client = pool) {
    validarAccesoId(accesoId);
    validarModelo(modelo);
    validarClient(client);
    const result = await client.query(
      `SELECT 1
         FROM acceso_oposicion_modelos
        WHERE acceso_id = $1 AND modelo = $2
        LIMIT 1`,
      [accesoId, modelo],
    );
    return result.rowCount === 1;
  },

  async insertarModelo(accesoId, modelo, client = pool) {
    validarAccesoId(accesoId);
    validarModelo(modelo);
    validarClient(client);
    const result = await client.query(
      `INSERT INTO acceso_oposicion_modelos (acceso_id, modelo)
       VALUES ($1, $2)
       RETURNING id, acceso_id, modelo, creado_en`,
      [accesoId, modelo],
    );
    return mapearModelo(result.rows[0]);
  },

  async eliminarModelo(accesoId, modelo, client = pool) {
    validarAccesoId(accesoId);
    validarModelo(modelo);
    validarClient(client);
    const result = await client.query(
      `WITH locked AS MATERIALIZED (
             SELECT id, acceso_id, modelo, creado_en
               FROM acceso_oposicion_modelos
              WHERE acceso_id = $1
              FOR UPDATE
           ), stats AS (
             SELECT COUNT(*)::INTEGER AS model_count,
                    EXISTS (SELECT 1 FROM locked WHERE modelo = $2) AS model_exists
               FROM locked
           ), deleted AS (
             DELETE FROM acceso_oposicion_modelos
              WHERE id = (SELECT id FROM locked WHERE modelo = $2)
                AND (SELECT COUNT(*) FROM locked) > 1
              RETURNING id, acceso_id, modelo, creado_en
           )
       SELECT deleted.id, deleted.acceso_id, deleted.modelo, deleted.creado_en,
              stats.model_count, stats.model_exists
         FROM stats
         LEFT JOIN deleted ON TRUE`,
      [accesoId, modelo],
    );
    const row = result.rows[0];
    if (!row.model_exists) {
      return { cambiado: false, modelo: null };
    }
    if (row.model_count <= 1 || row.id === null) {
      throw new Error('No se puede dejar un acceso sin modelos o el modelo no existe');
    }
    return { cambiado: true, modelo: mapearModelo(row) };
  },

  async reemplazarModelos(accesoId, modelos, client) {
    validarAccesoId(accesoId);
    validarClient(client);
    const modelosNormalizados = normalizarModelos(modelos);
    const actuales = (await listarFilas(accesoId, client)).map((row) => row.modelo);

    if (actuales.length === modelosNormalizados.length
      && actuales.every((modelo, index) => modelo === modelosNormalizados[index])) {
      return { cambiado: false, modelos: actuales };
    }

    await client.query(
      'DELETE FROM acceso_oposicion_modelos WHERE acceso_id = $1',
      [accesoId],
    );

    for (const modelo of modelosNormalizados) {
      await client.query(
        `INSERT INTO acceso_oposicion_modelos (acceso_id, modelo)
         VALUES ($1, $2)`,
        [accesoId, modelo],
      );
    }

    return { cambiado: true, modelos: modelosNormalizados };
  },
};
