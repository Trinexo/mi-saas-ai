import pool from '../config/db.js';

export const progressGeneralStatsRepository = {
  async getUserStats(userId) {
    const result = await pool.query(
      `SELECT COUNT(rt.test_id)::int AS total_tests,
              COALESCE(SUM(rt.aciertos), 0)::int AS aciertos,
              COALESCE(SUM(rt.errores), 0)::int AS errores,
              COALESCE(SUM(rt.blancos), 0)::int AS blancos,
              COALESCE(ROUND(AVG(rt.nota), 2), 0) AS nota_media,
              COALESCE(ROUND(AVG(rt.tiempo_segundos), 2), 0) AS tiempo_medio
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'`,
      [userId],
    );
    const row = result.rows[0];
    return {
      totalTests: Number(row.total_tests ?? 0),
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      blancos: Number(row.blancos ?? 0),
      notaMedia: Number(row.nota_media ?? 0),
      tiempoMedio: Number(row.tiempo_medio ?? 0),
    };
  },

  async getDashboard(userId) {
    const result = await pool.query(
      `WITH total_tests AS (
         SELECT COUNT(*)::int AS valor
         FROM tests
         WHERE usuario_id = $1 AND estado = 'finalizado'
       ),
       nota_media AS (
         SELECT COALESCE(ROUND(AVG(rt.nota)::numeric, 1), 0) AS valor
         FROM resultados_test rt
         JOIN tests t ON t.id = rt.test_id
         WHERE t.usuario_id = $1 AND t.estado = 'finalizado'
       ),
       mejor_simulacro AS (
         SELECT COALESCE(MAX(rt.nota), 0) AS valor
         FROM resultados_test rt
         JOIN tests t ON t.id = rt.test_id
         WHERE t.usuario_id = $1
           AND t.tipo_test = 'simulacro'
           AND t.estado = 'finalizado'
       ),
       pendientes_repaso AS (
         SELECT COUNT(*)::int AS valor
         FROM repeticion_espaciada
         WHERE usuario_id = $1 AND proxima_revision <= NOW()
       ),
       total_marcadas AS (
         SELECT COUNT(*)::int AS valor
         FROM preguntas_marcadas
         WHERE usuario_id = $1
       )
       SELECT
         (SELECT valor FROM total_tests)       AS total_tests,
         (SELECT valor FROM nota_media)        AS nota_media,
         (SELECT valor FROM mejor_simulacro)   AS mejor_simulacro,
         (SELECT valor FROM pendientes_repaso) AS pendientes_repaso,
         (SELECT valor FROM total_marcadas)    AS total_marcadas`,
      [userId],
    );
    const r = result.rows[0];
    return {
      totalTests: r.total_tests,
      notaMedia: Number(r.nota_media),
      mejorSimulacro: Number(r.mejor_simulacro),
      pendientesRepaso: r.pendientes_repaso,
      totalMarcadas: r.total_marcadas,
    };
  },

  async getSimulacrosStats(userId, oposicionId) {
    const result = await pool.query(
      `SELECT t.id AS test_id,
              t.fecha_creacion AS fecha,
              t.duracion_segundos,
              rt.nota,
              rt.aciertos,
              rt.errores,
              rt.blancos,
              rt.tiempo_segundos AS tiempo_real_segundos
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.oposicion_id = $2
         AND t.tipo_test = 'simulacro'
         AND t.estado = 'finalizado'
       ORDER BY t.fecha_creacion DESC`,
      [userId, oposicionId],
    );
    return result.rows.map((r) => ({
      testId: Number(r.test_id),
      fecha: r.fecha,
      nota: Number(r.nota),
      aciertos: r.aciertos,
      errores: r.errores,
      blancos: r.blancos,
      duracionSegundos: r.duracion_segundos,
      tiempoRealSegundos: r.tiempo_real_segundos,
    }));
  },
};
