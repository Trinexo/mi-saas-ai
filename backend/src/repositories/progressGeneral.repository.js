import pool from '../config/db.js';

export const progressGeneralRepository = {
  async getUserStats(userId) {
    const result = await pool.query(
      `SELECT COUNT(rt.test_id)::int AS total_tests,
              COALESCE(SUM(rt.aciertos), 0)::int AS aciertos,
              COALESCE(SUM(rt.errores), 0)::int AS errores,
              COALESCE(SUM(rt.blancos), 0)::int AS blancos,
              COALESCE(ROUND(AVG(rt.nota), 2), 0) AS nota_media,
              COALESCE(ROUND(AVG(rt.tiempo_segundos), 2), 0) AS tiempo_medio
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'`,
      [userId],
    );
    const row = result.rows[0];
    return {
      totalTests: Number(row.total_tests ?? 0),
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      blancos: Number(row.blancos ?? 0),
      notaMedia: Number(row.nota_media ?? 0),
      tiempoMedio: Number(row.tiempo_medio ?? 0),
    };
  },

  async getDashboard(userId) {
    const result = await pool.query(
      `WITH total_tests AS (
         SELECT COUNT(*)::int AS valor
         FROM tests
         WHERE usuario_id = $1 AND estado = 'finalizado'
       ),
       nota_media AS (
         SELECT COALESCE(ROUND(AVG(rt.nota)::numeric, 1), 0) AS valor
         FROM resultados_test rt
         JOIN tests t ON t.id = rt.test_id
         WHERE t.usuario_id = $1 AND t.estado = 'finalizado'
       ),
       mejor_simulacro AS (
         SELECT COALESCE(MAX(rt.nota), 0) AS valor
         FROM resultados_test rt
         JOIN tests t ON t.id = rt.test_id
         WHERE t.usuario_id = $1
           AND t.tipo_test = 'simulacro'
           AND t.estado = 'finalizado'
       ),
       pendientes_repaso AS (
         SELECT COUNT(*)::int AS valor
         FROM repeticion_espaciada
         WHERE usuario_id = $1 AND proxima_revision <= NOW()
       ),
       total_marcadas AS (
         SELECT COUNT(*)::int AS valor
         FROM preguntas_marcadas
         WHERE usuario_id = $1
       )
       SELECT
         (SELECT valor FROM total_tests)       AS total_tests,
         (SELECT valor FROM nota_media)        AS nota_media,
         (SELECT valor FROM mejor_simulacro)   AS mejor_simulacro,
         (SELECT valor FROM pendientes_repaso) AS pendientes_repaso,
         (SELECT valor FROM total_marcadas)    AS total_marcadas`,
      [userId],
    );
    const r = result.rows[0];
    return {
      totalTests: r.total_tests,
      notaMedia: Number(r.nota_media),
      mejorSimulacro: Number(r.mejor_simulacro),
      pendientesRepaso: r.pendientes_repaso,
      totalMarcadas: r.total_marcadas,
    };
  },

  async getSimulacrosStats(userId, oposicionId) {
    const result = await pool.query(
      `SELECT t.id AS test_id,
              t.fecha_creacion AS fecha,
              t.duracion_segundos,
              rt.nota,
              rt.aciertos,
              rt.errores,
              rt.blancos,
              rt.tiempo_segundos AS tiempo_real_segundos
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.oposicion_id = $2
         AND t.tipo_test = 'simulacro'
         AND t.estado = 'finalizado'
       ORDER BY t.fecha_creacion DESC`,
      [userId, oposicionId],
    );
    return result.rows.map((r) => ({
      testId: Number(r.test_id),
      fecha: r.fecha,
      nota: Number(r.nota),
      aciertos: r.aciertos,
      errores: r.errores,
      blancos: r.blancos,
      duracionSegundos: r.duracion_segundos,
      tiempoRealSegundos: r.tiempo_real_segundos,
    }));
  },

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
