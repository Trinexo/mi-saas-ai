import pool from '../config/db.js';

/**
 * Repositorio de ranking de alumnos por oposición.
 *
 * Fórmula de score (doc sección 23):
 *   score = rendimiento*0.60 + actividad*0.25 + evolución*0.15
 *
 * - rendimiento : % medio de aciertos del usuario en esa oposición (0-100)
 * - actividad   : min(100, tests_realizados * 5) — normalizada a 0-100
 * - evolución   : 80 si ha habido actividad en los últimos 14 días, sino 20
 *
 * Privacidad: los alias se construyen como "Opositor_<truncated_id>" —
 * nunca se devuelve nombre ni email de otros usuarios.
 * El propio usuario siempre se incluye con isMe=true.
 */
export const rankingRepository = {
  /**
   * Calcula el score del usuario en una oposición concreta.
   * Retorna { rendimiento, actividad, evolucion, score, testsRealizados, ultimaActividad }
   */
  async getUserScore(userId, oposicionId) {
    const result = await pool.query(
      `SELECT
         COALESCE(ROUND(
           100.0 * SUM(rt.aciertos)::numeric / NULLIF(SUM(rt.aciertos + rt.errores + rt.blancos), 0)
         ), 0)::int                                          AS rendimiento,
         COUNT(DISTINCT t.id)::int                          AS tests_realizados,
         MAX(t.fecha_fin)                                   AS ultima_actividad
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id   = $1
         AND t.oposicion_id = $2
         AND t.estado       = 'finalizado'`,
      [userId, oposicionId],
    );
    const row = result.rows[0] ?? {};
    const rendimiento = Number(row.rendimiento ?? 0);
    const testsRealizados = Number(row.tests_realizados ?? 0);
    const ultimaActividad = row.ultima_actividad ?? null;
    const diasSinActividad = ultimaActividad
      ? (Date.now() - new Date(ultimaActividad).getTime()) / 86400000
      : Infinity;
    const actividad = Math.min(100, testsRealizados * 5);
    const evolucion = diasSinActividad <= 14 ? 80 : 20;
    const score = Math.round(rendimiento * 0.6 + actividad * 0.25 + evolucion * 0.15);
    return { rendimiento, actividad, evolucion, score, testsRealizados, ultimaActividad };
  },

  /**
   * Devuelve el top N de usuarios (anónimos) de la misma oposición, más
   * la fila del propio usuario aunque no esté en el top.
   *
   * Sólo se incluyen usuarios que tengan al menos 1 test finalizado.
   * Alias público: "Opositor_" + ultimos 4 dígitos del user_id (nunca nombre real).
   */
  async getTopByOposicion(oposicionId, userId, limit = 10) {
    const result = await pool.query(
      `WITH scores AS (
         SELECT
           t.usuario_id,
           COALESCE(ROUND(
             100.0 * SUM(rt.aciertos)::numeric / NULLIF(SUM(rt.aciertos + rt.errores + rt.blancos), 0)
           ), 0)::int                                       AS rendimiento,
           COUNT(DISTINCT t.id)::int                       AS tests_realizados,
           MAX(t.fecha_fin)                                AS ultima_actividad
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.oposicion_id = $1
           AND t.estado       = 'finalizado'
         GROUP BY t.usuario_id
         HAVING COUNT(DISTINCT t.id) >= 1
       ),
       scored AS (
         SELECT
           s.usuario_id,
           s.rendimiento,
           s.tests_realizados,
           s.ultima_actividad,
           LEAST(100, s.tests_realizados * 5)              AS actividad,
           CASE WHEN s.ultima_actividad > NOW() - INTERVAL '14 days' THEN 80 ELSE 20 END AS evolucion,
           ROUND(
             s.rendimiento * 0.6
             + LEAST(100, s.tests_realizados * 5) * 0.25
             + CASE WHEN s.ultima_actividad > NOW() - INTERVAL '14 days' THEN 80 ELSE 20 END * 0.15
           )::int                                          AS score
         FROM scores s
       ),
       ranked AS (
         SELECT *, ROW_NUMBER() OVER (ORDER BY score DESC, rendimiento DESC, tests_realizados DESC) AS posicion
         FROM scored
       )
       SELECT
         r.posicion,
         r.usuario_id,
         r.rendimiento,
         r.tests_realizados,
         r.ultima_actividad,
         r.score,
         (r.usuario_id = $2)                              AS is_me
       FROM ranked r
       WHERE r.posicion <= $3 OR r.usuario_id = $2
       ORDER BY r.posicion ASC`,
      [oposicionId, userId, limit],
    );

    return result.rows.map((row) => ({
      posicion: Number(row.posicion),
      alias: row.is_me ? null : `Opositor_${String(row.usuario_id).slice(-4).padStart(4, '0')}`,
      rendimiento: Number(row.rendimiento),
      testsRealizados: Number(row.tests_realizados),
      score: Number(row.score),
      isMe: Boolean(row.is_me),
    }));
  },

  /**
   * Cuenta el total de alumnos con actividad en la oposición (para mostrar
   * "superas a X de Y opositores").
   */
  async countParticipantes(oposicionId) {
    const result = await pool.query(
      `SELECT COUNT(DISTINCT t.usuario_id)::int AS total
       FROM tests t
       WHERE t.oposicion_id = $1 AND t.estado = 'finalizado'`,
      [oposicionId],
    );
    return Number(result.rows[0]?.total ?? 0);
  },
};
