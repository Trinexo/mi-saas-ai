import pool from '../config/db.js';

export const widgetRendimientoActividadSemanalRepository = {
  async getProgresoSemanal(userId) {
    const diasResult = await pool.query(
      `SELECT
         gs::date::text AS fecha,
         COALESCE(a.tests, 0)::int AS tests,
         COALESCE(a.aciertos, 0)::int AS aciertos,
         COALESCE(a.errores, 0)::int AS errores,
         COALESCE(a.blancos, 0)::int AS blancos,
         COALESCE(a.nota_media, 0)::numeric AS nota_media
       FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') gs
       LEFT JOIN (
         SELECT
           rt.fecha::date AS dia,
           COUNT(*)::int AS tests,
           COALESCE(SUM(rt.aciertos), 0)::int AS aciertos,
           COALESCE(SUM(rt.errores), 0)::int AS errores,
           COALESCE(SUM(rt.blancos), 0)::int AS blancos,
           COALESCE(ROUND(AVG(rt.nota), 2), 0) AS nota_media
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha::date >= CURRENT_DATE - INTERVAL '6 days'
         GROUP BY rt.fecha::date
       ) a ON a.dia = gs::date
       ORDER BY fecha ASC`,
      [userId],
    );

    const dias = diasResult.rows.map((row) => ({
      fecha: row.fecha,
      tests: Number(row.tests ?? 0),
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      blancos: Number(row.blancos ?? 0),
      notaMedia: Number(row.nota_media ?? 0),
    }));

    const testsSemana = dias.reduce((acc, d) => acc + d.tests, 0);
    const totalNotaPonderada = dias.reduce((acc, d) => acc + (d.notaMedia * d.tests), 0);
    const notaMediaSemana = testsSemana > 0 ? Number((totalNotaPonderada / testsSemana).toFixed(2)) : 0;

    return {
      dias,
      testsSemana,
      notaMediaSemana,
    };
  },

  async getResumenSemana(userId) {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS tests_ultimos_7_dias,
         COALESCE(ROUND(AVG(rt.nota)::numeric, 2), 0) AS nota_media_ultimos_7_dias,
         COALESCE(ROUND(AVG(rt.tiempo_segundos)::numeric, 0), 0)::int AS tiempo_medio_segundos_ultimos_7_dias,
         COALESCE(SUM(rt.aciertos), 0)::int AS aciertos_totales_ultimos_7_dias
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND t.fecha_fin >= NOW() - INTERVAL '7 days'`,
      [userId],
    );

    const row = result.rows[0] ?? {};
    return {
      testsUltimos7Dias: Number(row.tests_ultimos_7_dias ?? 0),
      notaMediaUltimos7Dias: Number(row.nota_media_ultimos_7_dias ?? 0),
      tiempoMedioSegundosUltimos7Dias: Number(row.tiempo_medio_segundos_ultimos_7_dias ?? 0),
      aciertosTotalesUltimos7Dias: Number(row.aciertos_totales_ultimos_7_dias ?? 0),
    };
  },
};
