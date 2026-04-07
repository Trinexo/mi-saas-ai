import pool from '../config/db.js';

export const adminReportesPreguntasRepository = {
  async listReportes(filters, limit, offset) {
    const args = [];
    const where = [];

    if (filters.estado) {
      args.push(filters.estado);
      where.push(`rp.estado = $${args.length}`);
    }

    args.push(limit, offset);

    const result = await pool.query(
      `SELECT rp.id,
              rp.pregunta_id,
              rp.usuario_id,
              rp.motivo,
              rp.estado,
              rp.fecha_creacion,
              p.enunciado AS pregunta_enunciado,
              u.email AS usuario_email
       FROM reportes_preguntas rp
       JOIN preguntas p ON p.id = rp.pregunta_id
       JOIN usuarios u ON u.id = rp.usuario_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY rp.fecha_creacion DESC, rp.id DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    return result.rows;
  },

  async countReportes(filters) {
    const args = [];
    const where = [];

    if (filters.estado) {
      args.push(filters.estado);
      where.push(`estado = $${args.length}`);
    }

    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM reportes_preguntas
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
      args,
    );

    return result.rows[0].total;
  },

  async updateReporteEstado(reporteId, estado) {
    const result = await pool.query(
      `UPDATE reportes_preguntas
       SET estado = $2
       WHERE id = $1
       RETURNING id`,
      [reporteId, estado],
    );

    return result.rowCount > 0;
  },
};
