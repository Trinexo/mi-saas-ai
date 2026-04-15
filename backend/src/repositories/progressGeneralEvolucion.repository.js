import pool from '../config/db.js';

export const progressGeneralEvolucionRepository = {
  async getEvolucion(userId, limit) {
    const result = await pool.query(
      `SELECT fecha_fin::date AS fecha, nota, tipo_test
       FROM (
         SELECT t.fecha_fin, rt.nota, t.tipo_test
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
         ORDER BY t.fecha_fin DESC
         LIMIT $2
       ) sub
       ORDER BY fecha_fin ASC`,
      [userId, limit],
    );
    return result.rows.map((r) => ({
      fecha: r.fecha,
      nota: Number(r.nota),
      tipoTest: r.tipo_test,
    }));
  },

  async getMisOposiciones(userId) {
    const result = await pool.query(
      `WITH preguntas_count AS (
         SELECT m.oposicion_id, COUNT(DISTINCT p.id)::int AS total_preguntas
         FROM preguntas p
         JOIN temas tm ON tm.id = p.tema_id
         JOIN materias m ON m.id = tm.materia_id
         GROUP BY m.oposicion_id
       ),
       -- Determina la oposición de cada test a través de sus preguntas,
       -- independientemente de si tests.oposicion_id está relleno o no.
       test_oposicion AS (
         SELECT DISTINCT t.id AS test_id, m.oposicion_id
         FROM tests t
         JOIN tests_preguntas tp ON tp.test_id = t.id
         JOIN preguntas p ON p.id = tp.pregunta_id
         JOIN temas tm ON tm.id = p.tema_id
         JOIN materias m ON m.id = tm.materia_id
         WHERE t.usuario_id = $1 AND t.estado = 'finalizado'
       ),
       user_stats AS (
         SELECT
           top.oposicion_id,
           COUNT(DISTINCT ru.pregunta_id)::int                                              AS respondidas,
           COUNT(DISTINCT CASE WHEN ru.correcta = true THEN ru.pregunta_id END)::int        AS dominadas,
           COUNT(DISTINCT t.id)::int                                                        AS tests_realizados,
           COUNT(ru.id) FILTER (WHERE ru.correcta = true)::int                              AS aciertos_intentos,
           COUNT(ru.id)::int                                                                AS intentos_totales,
           MAX(rt.fecha)                                                                    AS ultima_practica
         FROM tests t
         JOIN test_oposicion top ON top.test_id = t.id
         LEFT JOIN respuestas_usuario ru ON ru.test_id = t.id
         LEFT JOIN resultados_test rt ON rt.test_id = t.id
         GROUP BY top.oposicion_id
       )
       SELECT
         o.id AS oposicion_id,
         o.nombre,
         COALESCE(pc.total_preguntas, 0)    AS total_preguntas,
         COALESCE(us.respondidas, 0)         AS respondidas,
         COALESCE(us.dominadas, 0)           AS dominadas,
         COALESCE(us.tests_realizados, 0)    AS tests_realizados,
         COALESCE(us.aciertos_intentos, 0)   AS aciertos_intentos,
         COALESCE(us.intentos_totales, 0)    AS intentos_totales,
         us.ultima_practica
       FROM oposiciones o
       JOIN preguntas_count pc ON pc.oposicion_id = o.id
       INNER JOIN user_stats us ON us.oposicion_id = o.id
       ORDER BY us.ultima_practica DESC NULLS LAST`,
      [userId],
    );

    return result.rows.map((row) => {
      const totalPreguntas = Number(row.total_preguntas ?? 0);
      const respondidas = Number(row.respondidas ?? 0);
      const dominadas = Number(row.dominadas ?? 0);
      const intentosTotales = Number(row.intentos_totales ?? 0);
      const aciertosIntentos = Number(row.aciertos_intentos ?? 0);
      const dominio = totalPreguntas > 0
        ? Number(((dominadas / totalPreguntas) * 100).toFixed(1))
        : 0;
      const porcentajeAcierto = intentosTotales > 0
        ? Math.round((aciertosIntentos / intentosTotales) * 100)
        : 0;
      return {
        oposicionId: Number(row.oposicion_id),
        nombre: row.nombre,
        totalPreguntas,
        respondidas,
        dominadas,
        dominio,
        porcentajeAcierto,
        testsRealizados: Number(row.tests_realizados ?? 0),
        ultimaPractica: row.ultima_practica ?? null,
      };
    });
  },
};
