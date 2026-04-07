import pool from '../config/db.js';

export const widgetRendimientoMetricasPrecisionRepository = {
  async getBalancePrecision(userId) {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(rt.aciertos), 0)::int AS aciertos_totales,
         COALESCE(SUM(rt.errores), 0)::int AS errores_totales,
         COALESCE(SUM(rt.blancos), 0)::int AS blancos_totales
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND rt.fecha >= NOW() - INTERVAL '30 days'`,
      [userId],
    );

    const row = result.rows[0] ?? {};
    const aciertosTotales = Number(row.aciertos_totales ?? 0);
    const erroresTotales = Number(row.errores_totales ?? 0);
    const blancosTotales = Number(row.blancos_totales ?? 0);
    const total = aciertosTotales + erroresTotales + blancosTotales;

    const porcentajeAcierto = total > 0 ? Number(((aciertosTotales * 100) / total).toFixed(2)) : 0;
    const porcentajeError = total > 0 ? Number(((erroresTotales * 100) / total).toFixed(2)) : 0;
    const porcentajeBlanco = total > 0 ? Number(((blancosTotales * 100) / total).toFixed(2)) : 0;

    return {
      aciertosTotales,
      erroresTotales,
      blancosTotales,
      porcentajeAcierto,
      porcentajeError,
      porcentajeBlanco,
    };
  },

  async getRendimientoModos(userId) {
    const result = await pool.query(
      `SELECT
         t.tipo_test AS modo,
         COUNT(*)::int AS tests,
         COALESCE(ROUND(AVG(rt.nota), 2), 0) AS nota_media,
         COALESCE(SUM(rt.aciertos), 0)::int AS aciertos_totales,
         COALESCE(SUM(rt.errores), 0)::int AS errores_totales
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND rt.fecha >= NOW() - INTERVAL '30 days'
       GROUP BY t.tipo_test
       ORDER BY nota_media DESC, tests DESC`,
      [userId],
    );

    return result.rows.map((row) => ({
      modo: row.modo,
      tests: Number(row.tests ?? 0),
      notaMedia: Number(row.nota_media ?? 0),
      aciertosTotales: Number(row.aciertos_totales ?? 0),
      erroresTotales: Number(row.errores_totales ?? 0),
    }));
  },

  async getInsightMensual(userId) {
    const result = await pool.query(
      `WITH ultimos30 AS (
         SELECT rt.nota, rt.aciertos
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha >= NOW() - INTERVAL '30 days'
       ),
       ultimos7 AS (
         SELECT COALESCE(AVG(rt.nota), 0)::numeric AS avg_nota
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha >= NOW() - INTERVAL '7 days'
       ),
       previos7 AS (
         SELECT COALESCE(AVG(rt.nota), 0)::numeric AS avg_nota
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha < NOW() - INTERVAL '7 days'
           AND rt.fecha >= NOW() - INTERVAL '14 days'
       )
       SELECT
         (SELECT COUNT(*)::int FROM ultimos30) AS tests_ultimos_30_dias,
         (SELECT COALESCE(SUM(aciertos), 0)::int FROM ultimos30) AS aciertos_ultimos_30_dias,
         (SELECT COALESCE(ROUND(AVG(nota), 2), 0) FROM ultimos30) AS nota_media_ultimos_30_dias,
         ROUND(((SELECT avg_nota FROM ultimos7) - (SELECT avg_nota FROM previos7)), 2) AS delta_nota_7_dias`,
      [userId],
    );

    const row = result.rows[0] ?? {};
    const deltaNota7Dias = Number(row.delta_nota_7_dias ?? 0);

    let tendencia = 'estable';
    if (deltaNota7Dias >= 0.25) tendencia = 'subiendo';
    else if (deltaNota7Dias <= -0.25) tendencia = 'bajando';

    return {
      testsUltimos30Dias: Number(row.tests_ultimos_30_dias ?? 0),
      aciertosUltimos30Dias: Number(row.aciertos_ultimos_30_dias ?? 0),
      notaMediaUltimos30Dias: Number(row.nota_media_ultimos_30_dias ?? 0),
      deltaNota7Dias,
      tendencia,
    };
  },
};
