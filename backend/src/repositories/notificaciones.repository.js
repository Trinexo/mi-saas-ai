import pool from '../config/db.js';

export const notificacionesRepository = {
  async listByUsuario({ usuarioId, soloNoLeidas, limit, offset }) {
    const args = [usuarioId];
    let where = 'WHERE usuario_id = $1';

    if (soloNoLeidas) {
      where += ' AND leida = false';
    }

    args.push(limit, offset);

    const result = await pool.query(
      `SELECT id, tipo, titulo, mensaje, datos_extra, leida, creado_en
       FROM notificaciones
       ${where}
       ORDER BY creado_en DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    return result.rows;
  },

  async countByUsuario({ usuarioId, soloNoLeidas }) {
    const args = [usuarioId];
    let where = 'WHERE usuario_id = $1';

    if (soloNoLeidas) {
      where += ' AND leida = false';
    }

    const result = await pool.query(
      `SELECT COUNT(*)::int AS total FROM notificaciones ${where}`,
      args,
    );

    return result.rows[0].total;
  },

  async marcarLeida(notificacionId, usuarioId) {
    const result = await pool.query(
      `UPDATE notificaciones SET leida = true
       WHERE id = $1 AND usuario_id = $2
       RETURNING id`,
      [notificacionId, usuarioId],
    );
    return result.rowCount > 0;
  },

  async marcarTodasLeidas(usuarioId) {
    const result = await pool.query(
      `UPDATE notificaciones SET leida = true
       WHERE usuario_id = $1 AND leida = false`,
      [usuarioId],
    );
    return result.rowCount;
  },

  async crear({ usuarioId, tipo, titulo, mensaje, datosExtra = null }) {
    const result = await pool.query(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, datos_extra)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [usuarioId, tipo, titulo, mensaje, datosExtra ? JSON.stringify(datosExtra) : null],
    );
    return result.rows[0].id;
  },
};
