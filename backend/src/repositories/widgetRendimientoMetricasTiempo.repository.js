import pool from '../config/db.js';

export const widgetRendimientoMetricasTiempoRepository = {
  async getRitmoPregunta(userId) {
    const summaryResult = await pool.query(
      `SELECT
         COUNT(*)::int AS tests_analizados,
         COALESCE(SUM(rt.tiempo_segundos), 0)::int AS tiempo_total_segundos,
         COALESCE(SUM(rt.aciertos + rt.errores + rt.blancos), 0)::int AS preguntas_analizadas
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND rt.fecha >= NOW() - INTERVAL '30 days'`,
      [userId],
    );

    const trendResult = await pool.query(
      `WITH ultimos7 AS (
         SELECT
           COALESCE(SUM(rt.tiempo_segundos), 0)::numeric AS tiempo_total,
           COALESCE(SUM(rt.aciertos + rt.errores + rt.blancos), 0)::numeric AS preguntas_total
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha >= NOW() - INTERVAL '7 days'
       ),
       previos7 AS (
         SELECT
           COALESCE(SUM(rt.tiempo_segundos), 0)::numeric AS tiempo_total,
           COALESCE(SUM(rt.aciertos + rt.errores + rt.blancos), 0)::numeric AS preguntas_total
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha < NOW() - INTERVAL '7 days'
           AND rt.fecha >= NOW() - INTERVAL '14 days'
       )
       SELECT ROUND(
         (COALESCE((SELECT tiempo_total / NULLIF(preguntas_total, 0) FROM ultimos7), 0))
         -
         (COALESCE((SELECT tiempo_total / NULLIF(preguntas_total, 0) FROM previos7), 0)),
         2
       ) AS delta_segundos_por_pregunta`,
      [userId],
    );

    const row = summaryResult.rows[0] ?? {};
    const testsAnalizados = Number(row.tests_analizados ?? 0);
    const preguntasAnalizadas = Number(row.preguntas_analizadas ?? 0);
    const tiempoTotalSegundos = Number(row.tiempo_total_segundos ?? 0);

    const segundosMediosPorPregunta = preguntasAnalizadas > 0
      ? Number((tiempoTotalSegundos / preguntasAnalizadas).toFixed(2))
      : 0;

    const deltaSegundosPorPregunta = Number(trendResult.rows[0]?.delta_segundos_por_pregunta ?? 0);
    let tendenciaRitmo = 'estable';
    if (deltaSegundosPorPregunta <= -5) tendenciaRitmo = 'mejorando';
    else if (deltaSegundosPorPregunta >= 5) tendenciaRitmo = 'empeorando';

    return {
      segundosMediosPorPregunta,
      preguntasAnalizadas,
      testsAnalizados,
      tendenciaRitmo,
    };
  },

  async getEficienciaTiempo(userId) {
    const summaryResult = await pool.query(
      `SELECT
         COUNT(*)::int AS tests_analizados,
         COALESCE(ROUND(AVG(rt.tiempo_segundos), 0), 0)::int AS tiempo_medio_por_test_segundos,
         COALESCE(SUM(rt.aciertos), 0)::int AS aciertos_totales,
         COALESCE(SUM(rt.tiempo_segundos), 0)::int AS tiempo_total_segundos
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND rt.fecha >= NOW() - INTERVAL '30 days'`,
      [userId],
    );

    const trendResult = await pool.query(
      `WITH ultimos7 AS (
         SELECT COALESCE(AVG(rt.tiempo_segundos), 0)::numeric AS avg_tiempo
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha >= NOW() - INTERVAL '7 days'
       ),
       previos7 AS (
         SELECT COALESCE(AVG(rt.tiempo_segundos), 0)::numeric AS avg_tiempo
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha < NOW() - INTERVAL '7 days'
           AND rt.fecha >= NOW() - INTERVAL '14 days'
       )
       SELECT ROUND((SELECT avg_tiempo FROM ultimos7) - (SELECT avg_tiempo FROM previos7), 2) AS delta_tiempo`,
      [userId],
    );

    const row = summaryResult.rows[0] ?? {};
    const testsAnalizados = Number(row.tests_analizados ?? 0);
    const tiempoMedioPorTestSegundos = Number(row.tiempo_medio_por_test_segundos ?? 0);
    const aciertosTotales = Number(row.aciertos_totales ?? 0);
    const tiempoTotalSegundos = Number(row.tiempo_total_segundos ?? 0);
    const aciertosPorMinuto = tiempoTotalSegundos > 0
      ? Number(((aciertosTotales * 60) / tiempoTotalSegundos).toFixed(2))
      : 0;

    const deltaTiempo = Number(trendResult.rows[0]?.delta_tiempo ?? 0);
    let tendenciaTiempo = 'estable';
    if (deltaTiempo <= -15) tendenciaTiempo = 'mejorando';
    else if (deltaTiempo >= 15) tendenciaTiempo = 'empeorando';

    return {
      tiempoMedioPorTestSegundos,
      aciertosPorMinuto,
      testsAnalizados,
      tendenciaTiempo,
    };
  },
};
