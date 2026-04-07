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
      `SELECT
         o.id AS oposicion_id,
         o.nombre,
         COUNT(DISTINCT p.id)::int AS total_preguntas,
         COALESCE(SUM(pu.aciertos + pu.errores), 0)::int AS respondidas,
         COALESCE(SUM(pu.aciertos), 0)::int AS aciertos,
         COUNT(DISTINCT t2.id) FILTER (WHERE t2.estado = 'finalizado')::int AS tests_realizados,
         MAX(rt.fecha) AS ultima_practica
       FROM oposiciones o
       JOIN materias m ON m.oposicion_id = o.id
       JOIN temas tm ON tm.materia_id = m.id
       LEFT JOIN preguntas p ON p.tema_id = tm.id AND p.activo = true
       LEFT JOIN progreso_usuario pu ON pu.tema_id = tm.id AND pu.usuario_id = $1
       LEFT JOIN tests t2 ON t2.usuario_id = $1 AND t2.oposicion_id = o.id
       LEFT JOIN resultados_test rt ON rt.test_id = t2.id
       WHERE EXISTS (
         SELECT 1 FROM tests t3
         WHERE t3.usuario_id = $1
           AND t3.oposicion_id = o.id
           AND t3.estado = 'finalizado'
       )
       GROUP BY o.id, o.nombre
       ORDER BY MAX(rt.fecha) DESC NULLS LAST`,
      [userId],
    );

    return result.rows.map((row) => {
      const totalPreguntas = Number(row.total_preguntas ?? 0);
      const respondidas = Number(row.respondidas ?? 0);
      const maestria = totalPreguntas > 0
        ? Number(((respondidas / totalPreguntas) * 100).toFixed(1))
        : 0;
      return {
        oposicionId: Number(row.oposicion_id),
        nombre: row.nombre,
        totalPreguntas,
        respondidas,
        aciertos: Number(row.aciertos ?? 0),
        maestria,
        testsRealizados: Number(row.tests_realizados ?? 0),
        ultimaPractica: row.ultima_practica ?? null,
      };
    });
  },
};
