import pool from '../config/db.js';

export const accesoOposicionRepository = {
  /**
   * Devuelve los accesos activos del usuario incluyendo el nombre de la oposición.
   */
  async getAccesosActivos(userId) {
    const result = await pool.query(
      `SELECT a.oposicion_id, o.nombre, a.fecha_fin,
              a.tipo_alumno, a.modo_preparacion
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
              ao.tipo_alumno, ao.modo_preparacion
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

  async updateModoPreparacion(userId, oposicionId, modoPreparacion) {
    const result = await pool.query(
      `UPDATE accesos_oposicion
       SET modo_preparacion = $3,
           actualizada_en = NOW()
       WHERE usuario_id = $1
         AND oposicion_id = $2
         AND estado = 'activo'
         AND (fecha_fin IS NULL OR fecha_fin > NOW())
       RETURNING usuario_id, oposicion_id, tipo_alumno, modo_preparacion`,
      [userId, oposicionId, modoPreparacion],
    );
    return result.rows[0] ?? null;
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
  async crearAcceso({
    userId,
    oposicionId,
    fechaFin = null,
    precioPagado = null,
    notas = null,
    tipoAlumno = 'libre',
    modoPreparacion = 'albacer',
  }) {
    const result = await pool.query(
      `INSERT INTO accesos_oposicion
         (usuario_id, oposicion_id, estado, fecha_fin, precio_pagado, notas, tipo_alumno, modo_preparacion)
       VALUES ($1, $2, 'activo', $3, $4, $5, $6, $7)
       ON CONFLICT (usuario_id, oposicion_id)
       DO UPDATE SET
         estado         = 'activo',
         fecha_fin      = EXCLUDED.fecha_fin,
         precio_pagado  = COALESCE(EXCLUDED.precio_pagado, accesos_oposicion.precio_pagado),
         notas          = COALESCE(EXCLUDED.notas, accesos_oposicion.notas),
         tipo_alumno    = EXCLUDED.tipo_alumno,
         modo_preparacion = EXCLUDED.modo_preparacion,
         actualizada_en = NOW()
       RETURNING *`,
      [userId, oposicionId, fechaFin, precioPagado, notas, tipoAlumno, modoPreparacion],
    );
    return result.rows[0];
  },

  /**
   * Actualiza los campos editables de un acceso (admin).
   */
  async updateAcceso(userId, oposicionId, { fechaFin, precioPagado, notas, estado, tipoAlumno, modoPreparacion }) {
    const result = await pool.query(
      `UPDATE accesos_oposicion
       SET   fecha_fin      = $3,
             precio_pagado  = $4,
             notas          = $5,
             estado         = $6,
             tipo_alumno    = COALESCE($7, tipo_alumno),
             modo_preparacion = COALESCE($8, modo_preparacion),
             actualizada_en = NOW()
       WHERE usuario_id = $1 AND oposicion_id = $2
       RETURNING *`,
      [
        userId,
        oposicionId,
        fechaFin ?? null,
        precioPagado ?? null,
        notas ?? null,
        estado,
        tipoAlumno,
        modoPreparacion,
      ],
    );
    return result.rows[0] ?? null;
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
                ao.tipo_alumno, ao.modo_preparacion,
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
