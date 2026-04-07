import pool from '../config/db.js';

export const widgetEngagementRachaGamificacionRepository = {
  async getGamificacion(userId) {
    const result = await pool.query(
      `WITH tests_finalizados AS (
         SELECT COUNT(*)::int AS total
         FROM tests
         WHERE usuario_id = $1
           AND estado = 'finalizado'
       ),
       aciertos_totales AS (
         SELECT COALESCE(SUM(rt.aciertos), 0)::int AS total
         FROM resultados_test rt
         JOIN tests t ON t.id = rt.test_id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
       )
       SELECT
         (SELECT total FROM tests_finalizados) AS total_tests,
         (SELECT total FROM aciertos_totales) AS total_aciertos`,
      [userId],
    );

    const totalTests = Number(result.rows[0]?.total_tests ?? 0);
    const totalAciertos = Number(result.rows[0]?.total_aciertos ?? 0);

    const xpTotal = totalTests * 10 + totalAciertos * 2;
    const nivelActual = Math.floor(xpTotal / 100) + 1;
    const xpNivelBase = (nivelActual - 1) * 100;
    const xpSiguienteNivel = nivelActual * 100;
    const progresoNivel = xpTotal - xpNivelBase;

    return {
      xpTotal,
      nivelActual,
      xpSiguienteNivel,
      progresoNivel,
    };
  },
};
