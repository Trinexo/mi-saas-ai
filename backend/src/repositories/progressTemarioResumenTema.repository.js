import pool from '../config/db.js';

export const progressTemarioResumenTemaRepository = {
  async getBloqueStats(userId, bloqueId) {
    const result = await pool.query(
      `SELECT bloque_id,
              preguntas_vistas,
              aciertos,
              errores
       FROM progreso_usuario
       WHERE usuario_id = $1 AND bloque_id = $2`,
      [userId, bloqueId],
    );
    const row = result.rows[0];
    return {
      bloqueId: Number(row?.bloque_id ?? bloqueId),
      preguntasVistas: Number(row?.preguntas_vistas ?? 0),
      aciertos: Number(row?.aciertos ?? 0),
      errores: Number(row?.errores ?? 0),
    };
  },

  async getRepasoStats(userId, bloqueId) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS pendientes
       FROM repeticion_espaciada re
       JOIN preguntas p ON p.id = re.pregunta_id
       WHERE re.usuario_id = $1
         AND p.bloque_id = $2
         AND re.proxima_revision <= NOW()`,
      [userId, bloqueId],
    );
    return { pendientes: result.rows[0].pendientes };
  },
};
