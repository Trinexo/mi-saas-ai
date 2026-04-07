import pool from '../config/db.js';

export const adminReportesAuditoriaRepository = {
  async insertAuditoria({ accion, preguntaId, userId, userRole, datosAnteriores = null }) {
    await pool.query(
      `INSERT INTO auditoria_preguntas (accion, pregunta_id, usuario_id, usuario_role, datos_anteriores)
       VALUES ($1, $2, $3, $4, $5)`,
      [accion, preguntaId, userId, userRole, datosAnteriores ? JSON.stringify(datosAnteriores) : null],
    );
  },

  async listAuditoria({ page, pageSize, preguntaId, usuarioId, accion }) {
    const args = [];
    const where = [];

    if (preguntaId) {
      args.push(preguntaId);
      where.push(`pregunta_id = $${args.length}`);
    }
    if (usuarioId) {
      args.push(usuarioId);
      where.push(`usuario_id = $${args.length}`);
    }
    if (accion) {
      args.push(accion);
      where.push(`accion = $${args.length}`);
    }

    const offset = (page - 1) * pageSize;
    args.push(pageSize, offset);

    const result = await pool.query(
      `SELECT id, accion, pregunta_id, usuario_id, usuario_role, fecha, datos_anteriores
       FROM auditoria_preguntas
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY fecha DESC, id DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    return result.rows;
  },

  async countAuditoria({ preguntaId, usuarioId, accion }) {
    const args = [];
    const where = [];

    if (preguntaId) {
      args.push(preguntaId);
      where.push(`pregunta_id = $${args.length}`);
    }
    if (usuarioId) {
      args.push(usuarioId);
      where.push(`usuario_id = $${args.length}`);
    }
    if (accion) {
      args.push(accion);
      where.push(`accion = $${args.length}`);
    }

    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM auditoria_preguntas
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
      args,
    );

    return result.rows[0].total;
  },
};
