import pool from '../config/db.js';

export const widgetRendimientoRepository = {
  async getConsistenciaDiaria(userId) {
    const summaryResult = await pool.query(
      `WITH actividad_30 AS (
         SELECT DISTINCT rt.fecha::date AS dia
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha::date >= CURRENT_DATE - INTERVAL '29 days'
       )
       SELECT
         COUNT(*)::int AS dias_activos_30,
         ROUND((COUNT(*)::numeric / 30) * 100, 2) AS porcentaje_constancia
       FROM actividad_30`,
      [userId],
    );

    const trendResult = await pool.query(
      `WITH ultimos14 AS (
         SELECT COUNT(DISTINCT rt.fecha::date)::int AS dias_activos
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha::date >= CURRENT_DATE - INTERVAL '13 days'
       ),
       previos14 AS (
         SELECT COUNT(DISTINCT rt.fecha::date)::int AS dias_activos
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha::date >= CURRENT_DATE - INTERVAL '27 days'
           AND rt.fecha::date < CURRENT_DATE - INTERVAL '13 days'
       )
       SELECT
         (SELECT dias_activos FROM ultimos14) - (SELECT dias_activos FROM previos14) AS delta_dias_activos`,
      [userId],
    );

    const row = summaryResult.rows[0] ?? {};
    const diasActivos30 = Number(row.dias_activos_30 ?? 0);
    const porcentajeConstancia = Number(row.porcentaje_constancia ?? 0);
    const diasInactivos30 = Math.max(0, 30 - diasActivos30);

    const deltaDiasActivos = Number(trendResult.rows[0]?.delta_dias_activos ?? 0);
    let tendenciaConstancia = 'estable';
    if (deltaDiasActivos >= 2) tendenciaConstancia = 'mejorando';
    else if (deltaDiasActivos <= -2) tendenciaConstancia = 'empeorando';

    return {
      diasActivos30,
      diasInactivos30,
      porcentajeConstancia,
      tendenciaConstancia,
    };
  },

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

  async getActividad14Dias(userId) {
    const result = await pool.query(
      `SELECT gs::date::text AS fecha,
              COALESCE(a.tests, 0)::int AS tests
       FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') gs
       LEFT JOIN (
         SELECT rt.fecha::date AS dia, COUNT(*)::int AS tests
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha::date >= CURRENT_DATE - INTERVAL '13 days'
         GROUP BY rt.fecha::date
       ) a ON a.dia = gs::date
       ORDER BY fecha ASC`,
      [userId],
    );

    const actividad14Dias = result.rows.map((row) => ({
      fecha: row.fecha,
      tests: Number(row.tests ?? 0),
      activo: Number(row.tests ?? 0) > 0,
    }));

    return {
      diasActivos14: actividad14Dias.filter((d) => d.activo).length,
      estudioHoy: actividad14Dias[actividad14Dias.length - 1]?.activo ?? false,
      actividad14Dias,
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
