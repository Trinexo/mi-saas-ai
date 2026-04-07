import pool from '../config/db.js';

export const progressTemarioResumenTemaRepository = {
  async getTemaStats(userId, temaId) {
    const result = await pool.query(
      `SELECT tema_id,
              preguntas_vistas,
              aciertos,
              errores
       FROM progreso_usuario
       WHERE usuario_id = $1 AND tema_id = $2`,
      [userId, temaId],
    );
    const row = result.rows[0];
    return {
      temaId: Number(row?.tema_id ?? temaId),
      preguntasVistas: Number(row?.preguntas_vistas ?? 0),
      aciertos: Number(row?.aciertos ?? 0),
      errores: Number(row?.errores ?? 0),
    };
  },

  async getRepasoStats(userId, temaId) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS pendientes
       FROM repeticion_espaciada re
       JOIN preguntas p ON p.id = re.pregunta_id
       WHERE re.usuario_id = $1
         AND p.tema_id = $2
         AND re.proxima_revision <= NOW()`,
      [userId, temaId],
    );
    return { pendientes: result.rows[0].pendientes };
  },
};
