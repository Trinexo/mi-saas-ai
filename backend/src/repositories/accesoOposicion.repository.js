import pool from '../config/db.js';

export function modoActivoDesdePreparacion(modoPreparacion) {
  if (modoPreparacion === 'experto') return 'experto';
  if (modoPreparacion === 'albacer') return 'guiado';
  throw new Error(`Modo de preparación no soportado: ${modoPreparacion}`);
}

async function sincronizarModeloUnico(client, accesoId, modoActivo) {
  const result = await client.query(
    `SELECT modelo
       FROM acceso_oposicion_modelos
      WHERE acceso_id = $1
      FOR UPDATE`,
    [accesoId],
  );

  if (result.rowCount > 1) {
    const error = new Error('No se puede sincronizar un acceso multi-modelo desde el flujo legacy');
    error.code = 'LEGACY_MODE_MULTI_MODEL_CONFLICT';
    throw error;
  }

  if (result.rowCount === 1) {
    if (result.rows[0].modelo !== modoActivo) {
      await client.query(
        `UPDATE acceso_oposicion_modelos
            SET modelo = $2
          WHERE acceso_id = $1`,
        [accesoId, modoActivo],
      );
    }
    return;
  }

  await client.query(
    `INSERT INTO acceso_oposicion_modelos (acceso_id, modelo)
     VALUES ($1, $2)`,
    [accesoId, modoActivo],
  );
}

async function enTransaccion(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export const accesoOposicionRepository = {
  /**
   * Lee en una sola sentencia la existencia de usuario/oposición, el acceso
   * correspondiente y sus modelos canónicos. Los timestamps se convierten a
   * texto para que node-postgres no aplique la zona horaria local del proceso.
   */
  async obtenerLecturaContexto(usuarioId, oposicionId, client = pool) {
    const result = await client.query(
      `SELECT u.id IS NOT NULL AS usuario_existe,
              o.id IS NOT NULL AS oposicion_existe,
              u.id AS usuario_id,
              o.id AS oposicion_id,
              ao.id AS acceso_id,
              ao.estado,
              ao.modo_activo,
              ao.modo_preparacion,
              ao.fecha_inicio::TEXT AS fecha_inicio,
              ao.fecha_fin::TEXT AS fecha_fin,
              COALESCE(
                ARRAY_AGG(aom.modelo ORDER BY
                  CASE aom.modelo WHEN 'experto' THEN 1 WHEN 'guiado' THEN 2 ELSE 3 END,
                  aom.id
                ) FILTER (WHERE aom.modelo IS NOT NULL),
                ARRAY[]::TEXT[]
              ) AS modelos
         FROM (SELECT $1::BIGINT AS usuario_id, $2::BIGINT AS oposicion_id) requested
         LEFT JOIN usuarios u ON u.id = requested.usuario_id
         LEFT JOIN oposiciones o ON o.id = requested.oposicion_id
         LEFT JOIN accesos_oposicion ao
           ON ao.usuario_id = requested.usuario_id
          AND ao.oposicion_id = requested.oposicion_id
         LEFT JOIN acceso_oposicion_modelos aom ON aom.acceso_id = ao.id
        GROUP BY u.id, o.id, ao.id, ao.estado, ao.modo_activo,
                 ao.modo_preparacion, ao.fecha_inicio, ao.fecha_fin`,
      [usuarioId, oposicionId],
    );
    return result.rows;
  },

  async obtenerParaCambioModo(accesoId, client = pool) {
    const result = await client.query(
      `SELECT id, usuario_id, oposicion_id, estado, modo_activo,
              modo_preparacion, fecha_inicio::TEXT AS fecha_inicio,
              fecha_fin::TEXT AS fecha_fin, precio_pagado, notas
         FROM accesos_oposicion
        WHERE id = $1
        FOR UPDATE`,
      [accesoId],
    );
    return result.rows[0] ?? null;
  },

  /**
   * Devuelve los accesos activos del usuario incluyendo el nombre de la oposición.
   */
  async getAccesosActivos(userId) {
    const result = await pool.query(
      `SELECT a.oposicion_id, o.nombre, a.fecha_fin,
              a.tipo_alumno, a.modo_preparacion, a.ranking_publico
       FROM accesos_oposicion a
       JOIN oposiciones o ON o.id = a.oposicion_id
       WHERE a.usuario_id = $1
         AND a.estado = 'activo'
         AND (a.fecha_fin IS NULL OR a.fecha_fin > NOW())
       ORDER BY a.fecha_inicio DESC`,
      [userId],
    );
    return result.rows;
  },

  async getPreparacion(userId, oposicionId) {
    const result = await pool.query(
      `SELECT ao.usuario_id, ao.oposicion_id, o.nombre,
              ao.tipo_alumno, ao.modo_preparacion, ao.ranking_publico
       FROM accesos_oposicion ao
       JOIN oposiciones o ON o.id = ao.oposicion_id
       WHERE ao.usuario_id = $1
         AND ao.oposicion_id = $2
         AND ao.estado = 'activo'
         AND (ao.fecha_fin IS NULL OR ao.fecha_fin > NOW())
       LIMIT 1`,
      [userId, oposicionId],
    );
    return result.rows[0] ?? null;
  },

  async updatePreparacion(userId, oposicionId, fields = {}) {
    const modoActivo = fields.modoPreparacion == null
      ? null
      : modoActivoDesdePreparacion(fields.modoPreparacion);

    return enTransaccion(async (client) => {
      const current = await client.query(
        `SELECT id, modo_preparacion, modo_activo
           FROM accesos_oposicion
          WHERE usuario_id = $1
            AND oposicion_id = $2
            AND estado = 'activo'
            AND (fecha_fin IS NULL OR fecha_fin > NOW())
          FOR UPDATE`,
        [userId, oposicionId],
      );
      if (current.rowCount === 0) return null;

      const result = await client.query(
        `UPDATE accesos_oposicion
         SET modo_preparacion = COALESCE($2, modo_preparacion),
             modo_activo = COALESCE($4, modo_activo),
             ranking_publico = COALESCE($3, ranking_publico),
             actualizada_en = NOW()
         WHERE id = $1
         RETURNING id, usuario_id, oposicion_id, tipo_alumno, modo_preparacion, modo_activo, ranking_publico`,
        [current.rows[0].id, fields.modoPreparacion ?? null, fields.rankingPublico ?? null, modoActivo],
      );
      const acceso = result.rows[0] ?? null;
      if (acceso && modoActivo !== null) await sincronizarModeloUnico(client, acceso.id, acceso.modo_activo);
      return acceso;
    });
  },

  async updateModoPreparacion(userId, oposicionId, modoPreparacion) {
    return accesoOposicionRepository.updatePreparacion(userId, oposicionId, { modoPreparacion });
  },

  /**
   * Comprueba si el usuario tiene acceso activo a una oposición concreta.
   */
  async tieneAcceso(userId, oposicionId) {
    const result = await pool.query(
      `SELECT 1 FROM accesos_oposicion
       WHERE usuario_id    = $1
         AND oposicion_id  = $2
         AND estado        = 'activo'
         AND (fecha_fin IS NULL OR fecha_fin > NOW())
       LIMIT 1`,
      [userId, oposicionId],
    );
    return result.rowCount > 0;
  },

  /**
   * Crea o reactiva un acceso a una oposición para un usuario.
   */
  /**
   * Crea o renueva un acceso legacy de un único modo.
   *
   * Si se recibe client, el caller debe haber abierto la transacción y debe
   * mantenerla hasta que esta operación termine. Billing cumple ese contrato.
   * Sin client, este método abre y cierra su propia transacción.
   */
  async crearAcceso({
    userId,
    oposicionId,
    fechaFin = null,
    precioPagado = null,
    notas = null,
    tipoAlumno = 'libre',
    modoPreparacion = null,
    client = null,
  }) {
    const modoParaNuevoAcceso = modoPreparacion ?? 'albacer';
    const execute = async (dbClient) => {
      const current = await dbClient.query(
        `SELECT *
           FROM accesos_oposicion
          WHERE usuario_id = $1 AND oposicion_id = $2
          FOR UPDATE`,
        [userId, oposicionId],
      );

      let acceso;
      if (current.rowCount === 0) {
        const result = await dbClient.query(
          `INSERT INTO accesos_oposicion
             (usuario_id, oposicion_id, estado, fecha_fin, precio_pagado, notas, tipo_alumno, modo_preparacion, modo_activo)
           VALUES ($1, $2, 'activo', $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [userId, oposicionId, fechaFin ?? null, precioPagado ?? null, notas ?? null, tipoAlumno, modoParaNuevoAcceso, modoActivoDesdePreparacion(modoParaNuevoAcceso)],
        );
        acceso = result.rows[0];
      } else {
        const existing = current.rows[0];
        if (existing.estado === 'revocado' || existing.estado === 'cancelado') {
          const error = new Error(`No se puede reactivar un acceso ${existing.estado} desde el flujo legacy`);
          error.code = 'ACCESS_STATE_REACTIVATION_FORBIDDEN';
          throw error;
        }
        if (!['activo', 'expirado', 'pendiente_modo'].includes(existing.estado)) {
          const error = new Error(`Estado de acceso no soportado para renovación: ${existing.estado}`);
          error.code = 'ACCESS_STATE_TRANSITION_FORBIDDEN';
          throw error;
        }

        const modoParaAcceso = modoPreparacion ?? existing.modo_preparacion;
        const modoActivo = modoActivoDesdePreparacion(modoParaAcceso);

        const result = await dbClient.query(
          `UPDATE accesos_oposicion
              SET estado           = CASE WHEN estado = 'expirado' OR estado = 'pendiente_modo' THEN 'activo' ELSE estado END,
                  fecha_fin        = COALESCE($2, fecha_fin),
                  precio_pagado    = COALESCE($3, precio_pagado),
                  notas            = COALESCE($4, notas),
                  tipo_alumno      = COALESCE($5, tipo_alumno),
                  modo_preparacion = $6,
                  modo_activo      = $7,
                  actualizada_en   = NOW()
            WHERE id = $1
            RETURNING *`,
          [existing.id, fechaFin, precioPagado, notas, tipoAlumno, modoParaAcceso, modoActivo],
        );
        acceso = result.rows[0];
      }

      await sincronizarModeloUnico(dbClient, acceso.id, acceso.modo_activo);
      return acceso;
    };

    return client ? execute(client) : enTransaccion(execute);
  },

  /**
   * Actualiza los campos editables de un acceso (admin).
   */
  async updateAcceso(userId, oposicionId, { fechaFin, precioPagado, notas, estado, tipoAlumno, modoPreparacion }) {
    const modoActivo = modoPreparacion == null ? null : modoActivoDesdePreparacion(modoPreparacion);
    return enTransaccion(async (client) => {
      const current = await client.query(
        `SELECT id
           FROM accesos_oposicion
          WHERE usuario_id = $1 AND oposicion_id = $2
          FOR UPDATE`,
        [userId, oposicionId],
      );
      if (current.rowCount === 0) return null;

      if (modoActivo !== null) await sincronizarModeloUnico(client, current.rows[0].id, modoActivo);

      const result = await client.query(
        `UPDATE accesos_oposicion
         SET   fecha_fin        = COALESCE($2, fecha_fin),
               precio_pagado    = COALESCE($3, precio_pagado),
               notas            = COALESCE($4, notas),
               estado           = COALESCE($5, estado),
               tipo_alumno      = COALESCE($6, tipo_alumno),
               modo_preparacion = COALESCE($7, modo_preparacion),
               modo_activo      = COALESCE($8, modo_activo),
               actualizada_en   = NOW()
         WHERE id = $1
         RETURNING *`,
        [current.rows[0].id, fechaFin, precioPagado, notas, estado, tipoAlumno, modoPreparacion, modoActivo],
      );
      const acceso = result.rows[0] ?? null;
      return acceso;
    });
  },

  /**
   * Cancela el acceso de un usuario a una oposición.
   */
  async cancelarAcceso(userId, oposicionId) {
    const result = await pool.query(
      `UPDATE accesos_oposicion
       SET estado = 'cancelado', actualizada_en = NOW()
       WHERE usuario_id = $1 AND oposicion_id = $2
       RETURNING *`,
      [userId, oposicionId],
    );
    return result.rows[0] ?? null;
  },

  /**
   * Listado admin: todos los accesos con datos de usuario y oposición.
   * Filtros opcionales: email (búsqueda parcial sobre u.email) y oposicionId.
   */
  async listAll({ page = 1, pageSize = 20, email = null, oposicionId = null } = {}) {
    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];
    if (email) { params.push(`%${email.toLowerCase()}%`); conditions.push(`LOWER(u.email) LIKE $${params.length}`); }
    if (oposicionId) { params.push(oposicionId); conditions.push(`ao.oposicion_id = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(pageSize);
    params.push(offset);

    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT ao.id, ao.estado, ao.fecha_inicio, ao.fecha_fin, ao.precio_pagado, ao.notas,
                ao.usuario_id, u.nombre AS usuario_nombre, u.email AS usuario_email,
                ao.tipo_alumno, ao.modo_preparacion, ao.ranking_publico,
                ao.oposicion_id, o.nombre AS oposicion_nombre
         FROM accesos_oposicion ao
         JOIN usuarios   u ON u.id = ao.usuario_id
         JOIN oposiciones o ON o.id = ao.oposicion_id
         ${where}
         ORDER BY ao.creada_en DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      ),
      pool.query(
        `SELECT COUNT(*) FROM accesos_oposicion ao ${where}`,
        params.slice(0, -2),
      ),
    ]);

    return { items: rows.rows, total: Number(count.rows[0].count) };
  },

  /**
   * Devuelve el usuario por email (para asignación desde el panel admin).
   */
  async getUserByEmail(email) {
    const result = await pool.query(
      `SELECT id, nombre, email FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    return result.rows[0] ?? null;
  },

  /**
   * Stats para el panel admin.
   */
  async getStats() {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE estado = 'activo') AS total_activos,
         COUNT(DISTINCT usuario_id) FILTER (WHERE estado = 'activo') AS usuarios_con_acceso,
         COUNT(*) FILTER (WHERE estado = 'activo' AND creada_en >= NOW() - INTERVAL '7 days') AS nuevos_7d,
         COUNT(*) FILTER (WHERE estado = 'activo' AND creada_en >= NOW() - INTERVAL '30 days') AS nuevos_30d,
         SUM(precio_pagado) FILTER (WHERE estado = 'activo') AS ingresos_total
       FROM accesos_oposicion`,
    );
    return result.rows[0];
  },
};
