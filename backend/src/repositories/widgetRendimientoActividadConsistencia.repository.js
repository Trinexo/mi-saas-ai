import pool from '../config/db.js';

export const widgetRendimientoActividadConsistenciaRepository = {
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
};
