import pool from '../config/db.js';

export const statsRepository = {
  async getUserStats(userId) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS total_tests,
              COALESCE(SUM(rt.aciertos), 0)::int AS aciertos,
              COALESCE(SUM(rt.errores), 0)::int AS errores,
              COALESCE(SUM(rt.blancos), 0)::int AS blancos,
              COALESCE(ROUND(AVG(rt.nota), 2), 0) AS nota_media,
              COALESCE(ROUND(AVG(rt.tiempo_segundos), 2), 0) AS tiempo_medio
       FROM tests t
       LEFT JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1`,
      [userId],
    );

    return result.rows[0];
  },

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

    return result.rows[0] ?? { tema_id: temaId, preguntas_vistas: 0, aciertos: 0, errores: 0 };
  },
};