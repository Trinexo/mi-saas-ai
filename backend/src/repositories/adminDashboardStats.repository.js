import pool from '../config/db.js';

export const adminDashboardStatsRepository = {
  async getAdminStats() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM preguntas)                                      AS total_preguntas,
        (SELECT COUNT(*)::int FROM preguntas WHERE estado = 'pendiente')           AS pendientes_revision,
        (SELECT COUNT(*)::int FROM usuarios)                                       AS total_usuarios,
        (SELECT COUNT(*)::int FROM tests WHERE estado = 'completado')              AS total_tests,
        (SELECT COUNT(*)::int FROM tests
          WHERE estado = 'completado'
            AND created_at >= NOW() - INTERVAL '7 days')                          AS tests_esta_semana,
        (SELECT ROUND(AVG(nota_total)::numeric, 2)
          FROM tests WHERE estado = 'completado')                                  AS nota_media_global
    `);
    const row = result.rows[0];
    return {
      totalPreguntas: row.total_preguntas,
      pendientesRevision: row.pendientes_revision,
      totalUsuarios: row.total_usuarios,
      totalTests: row.total_tests,
      testsEstaSemana: row.tests_esta_semana,
      notaMediaGlobal: row.nota_media_global !== null ? Number(row.nota_media_global) : null,
    };
  },

  async getTemasConMasErrores(limit) {
    const result = await pool.query(
      `SELECT
         t.id            AS tema_id,
         t.nombre        AS tema_nombre,
         m.nombre        AS materia_nombre,
         COUNT(*)::int   AS total_respuestas,
         SUM(CASE WHEN ru.correcta = false THEN 1 ELSE 0 END)::int  AS total_errores,
         ROUND(
           SUM(CASE WHEN ru.correcta = false THEN 1 ELSE 0 END)::numeric
           / NULLIF(COUNT(*), 0) * 100, 1
         ) AS pct_error
       FROM respuestas_usuario ru
       JOIN preguntas p ON p.id = ru.pregunta_id
       JOIN temas t ON t.id = p.tema_id
       JOIN materias m ON m.id = t.materia_id
       WHERE ru.correcta IS NOT NULL
       GROUP BY t.id, t.nombre, m.nombre
       HAVING COUNT(*) >= 10
       ORDER BY total_errores DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows.map((r) => ({
      temaId: r.tema_id,
      temaNombre: r.tema_nombre,
      materiaNombre: r.materia_nombre,
      totalRespuestas: r.total_respuestas,
      totalErrores: r.total_errores,
      pctError: r.pct_error !== null ? Number(r.pct_error) : null,
    }));
  },
};
