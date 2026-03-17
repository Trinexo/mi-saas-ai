import pool from '../config/db.js';

export const reportesRepository = {
  async createReporte(userId, preguntaId, motivo) {
    const result = await pool.query(
      `INSERT INTO reportes_preguntas (pregunta_id, usuario_id, motivo)
       VALUES ($1, $2, $3)
       ON CONFLICT (usuario_id, pregunta_id) DO NOTHING
       RETURNING id`,
      [preguntaId, userId, motivo],
    );
    if (result.rowCount === 0) return { id: null, created: false };
    return { id: Number(result.rows[0].id), created: true };
  },
};
