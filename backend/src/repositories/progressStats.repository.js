import pool from '../config/db.js';

export const progressStatsRepository = {
  async getProgresoTemas(userId, oposicionId) {
    const conditions = ['pu.usuario_id = $1', '(pu.aciertos + pu.errores) > 0'];
    const params = [userId];
    if (oposicionId) { conditions.push('m.oposicion_id = $2'); params.push(oposicionId); }
    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
         pu.tema_id,
         t.nombre AS tema_nombre,
         m.id AS materia_id,
         m.nombre AS materia_nombre,
         o.id AS oposicion_id,
         o.nombre AS oposicion_nombre,
         pu.aciertos,
         pu.errores,
         (pu.aciertos + pu.errores) AS total_respondidas,
         ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 1) AS porcentaje_acierto
       FROM progreso_usuario pu
       JOIN temas t ON t.id = pu.tema_id
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       WHERE ${where}
       ORDER BY m.nombre ASC, porcentaje_acierto ASC NULLS FIRST`,
      params,
    );

    return result.rows.map((row) => ({
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      materiaId: Number(row.materia_id),
      materiaNombre: row.materia_nombre,
      oposicionId: Number(row.oposicion_id),
      oposicionNombre: row.oposicion_nombre,
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      totalRespondidas: Number(row.total_respondidas ?? 0),
      porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
    }));
  },

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

  async getTemaStats(userId, temaId) {
    const result = await pool.query(
      `SELECT tema_id,
              preguntas_vistas,
              aciertos,
              errores
       FROM progreso_usuario
       WHERE usuario_id = $1 AND tema_id = $2`,
      [userId, temaId],
    );
    const row = result.rows[0];
    return {
      temaId: Number(row?.tema_id ?? temaId),
      preguntasVistas: Number(row?.preguntas_vistas ?? 0),
      aciertos: Number(row?.aciertos ?? 0),
      errores: Number(row?.errores ?? 0),
    };
  },

  async getRepasoStats(userId, temaId) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS pendientes
       FROM repeticion_espaciada re
       JOIN preguntas p ON p.id = re.pregunta_id
       WHERE re.usuario_id = $1
         AND p.tema_id = $2
         AND re.proxima_revision <= NOW()`,
      [userId, temaId],
    );
    return { pendientes: result.rows[0].pendientes };
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

  async getResumenOposicion(userId, oposicionId) {
    const [metaResult, progresoResult, testResult] = await Promise.all([
      pool.query(
        `SELECT o.nombre AS oposicion_nombre,
                COUNT(DISTINCT t.id)::int AS total_temas
         FROM oposiciones o
         JOIN materias m ON m.oposicion_id = o.id
         JOIN temas t ON t.materia_id = m.id
         WHERE o.id = $1
         GROUP BY o.nombre`,
        [oposicionId],
      ),
      pool.query(
        `SELECT
           COUNT(DISTINCT pu.tema_id)::int AS temas_practicados,
           COALESCE(SUM(pu.aciertos + pu.errores), 0)::int AS total_respondidas,
           COALESCE(ROUND(AVG(
             CASE WHEN (pu.aciertos + pu.errores) > 0
               THEN (pu.aciertos::numeric / (pu.aciertos + pu.errores)) * 100
             END
           )::numeric, 1), 0) AS porcentaje_acierto_medio
         FROM progreso_usuario pu
         JOIN temas t ON t.id = pu.tema_id
         JOIN materias m ON m.id = t.materia_id
         WHERE pu.usuario_id = $1
           AND m.oposicion_id = $2
           AND (pu.aciertos + pu.errores) > 0`,
        [userId, oposicionId],
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS tests_realizados,
           COALESCE(ROUND(AVG(rt.nota)::numeric, 2), 0) AS nota_media
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         JOIN temas te ON te.id = t.tema_id
         JOIN materias m ON m.id = te.materia_id
         WHERE t.usuario_id = $1
           AND m.oposicion_id = $2
           AND t.estado = 'finalizado'`,
        [userId, oposicionId],
      ),
    ]);

    const totalTemas = Number(metaResult.rows[0]?.total_temas ?? 0);
    const temasPracticados = Number(progresoResult.rows[0]?.temas_practicados ?? 0);
    const totalRespondidas = Number(progresoResult.rows[0]?.total_respondidas ?? 0);
    const porcentajeAcierto = Number(progresoResult.rows[0]?.porcentaje_acierto_medio ?? 0);
    const testsRealizados = Number(testResult.rows[0]?.tests_realizados ?? 0);
    const notaMedia = Number(testResult.rows[0]?.nota_media ?? 0);
    const maestria = totalTemas > 0 ? Number(((temasPracticados / totalTemas) * 100).toFixed(1)) : 0;

    return {
      oposicionId: Number(oposicionId),
      oposicionNombre: metaResult.rows[0]?.oposicion_nombre ?? '',
      totalTemas,
      temasPracticados,
      maestria,
      totalRespondidas,
      porcentajeAcierto,
      testsRealizados,
      notaMedia,
    };
  },

  async getProgresoTemasByMateria(userId, materiaId) {
    const result = await pool.query(
      `SELECT
         t.id AS tema_id,
         t.nombre AS tema_nombre,
         m.id AS materia_id_col,
         m.nombre AS materia_nombre,
         o.id AS oposicion_id,
         o.nombre AS oposicion_nombre,
         COUNT(DISTINCT p.id)::int AS total_preguntas,
         COALESCE((pu.aciertos + pu.errores), 0)::int AS respondidas,
         COALESCE(pu.aciertos, 0)::int AS aciertos,
         COALESCE(
           ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 1),
           0
         ) AS porcentaje_acierto,
         pu.ultima_practica
       FROM temas t
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       LEFT JOIN preguntas p ON p.tema_id = t.id AND p.activo = true
       LEFT JOIN progreso_usuario pu ON pu.tema_id = t.id AND pu.usuario_id = $1
       WHERE t.materia_id = $2
       GROUP BY t.id, t.nombre, m.id, m.nombre, o.id, o.nombre, pu.aciertos, pu.errores, pu.ultima_practica
       ORDER BY t.nombre ASC`,
      [userId, materiaId],
    );

    return result.rows.map((row) => {
      const totalPreguntas = Number(row.total_preguntas ?? 0);
      const respondidas = Number(row.respondidas ?? 0);
      const maestria = totalPreguntas > 0
        ? Number(((respondidas / totalPreguntas) * 100).toFixed(1))
        : 0;
      return {
        temaId: Number(row.tema_id),
        temaNombre: row.tema_nombre,
        materiaId: Number(row.materia_id_col),
        materiaNombre: row.materia_nombre,
        oposicionId: Number(row.oposicion_id),
        oposicionNombre: row.oposicion_nombre,
        totalPreguntas,
        respondidas,
        aciertos: Number(row.aciertos ?? 0),
        maestria,
        porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
        ultimaPractica: row.ultima_practica ?? null,
      };
    });
  },

  async getDetalleTema(userId, temaId) {
    const [progresoResult, historialResult] = await Promise.all([
      pool.query(
        `SELECT
           t.id AS tema_id,
           t.nombre AS tema_nombre,
           m.id AS materia_id,
           m.nombre AS materia_nombre,
           o.id AS oposicion_id,
           o.nombre AS oposicion_nombre,
           COUNT(DISTINCT p.id)::int AS total_preguntas,
           COALESCE(pu.aciertos, 0)::int AS aciertos,
           COALESCE(pu.errores, 0)::int AS errores,
           COALESCE((pu.aciertos + pu.errores), 0)::int AS respondidas,
           COALESCE(
             ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 1),
             0
           ) AS porcentaje_acierto,
           pu.ultima_practica
         FROM temas t
         JOIN materias m ON m.id = t.materia_id
         JOIN oposiciones o ON o.id = m.oposicion_id
         LEFT JOIN preguntas p ON p.tema_id = t.id AND p.activo = true
         LEFT JOIN progreso_usuario pu ON pu.tema_id = t.id AND pu.usuario_id = $1
         WHERE t.id = $2
         GROUP BY t.id, t.nombre, m.id, m.nombre, o.id, o.nombre, pu.aciertos, pu.errores, pu.ultima_practica`,
        [userId, temaId],
      ),
      pool.query(
        `SELECT t.id AS test_id, t.fecha_creacion, t.tipo_test,
                rt.aciertos, rt.errores, rt.blancos, rt.nota, rt.tiempo_segundos
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.tema_id = $2
           AND t.estado = 'finalizado'
         ORDER BY t.fecha_creacion DESC
         LIMIT 5`,
        [userId, temaId],
      ),
    ]);

    if (progresoResult.rows.length === 0) return null;

    const row = progresoResult.rows[0];
    const totalPreguntas = Number(row.total_preguntas ?? 0);
    const respondidas = Number(row.respondidas ?? 0);
    const maestria = totalPreguntas > 0
      ? Number(((respondidas / totalPreguntas) * 100).toFixed(1))
      : 0;

    return {
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      materiaId: Number(row.materia_id),
      materiaNombre: row.materia_nombre,
      oposicionId: Number(row.oposicion_id),
      oposicionNombre: row.oposicion_nombre,
      totalPreguntas,
      respondidas,
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      maestria,
      porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
      ultimaPractica: row.ultima_practica ?? null,
      ultimosTests: historialResult.rows.map((h) => ({
        testId: Number(h.test_id),
        fecha: h.fecha_creacion,
        tipoTest: h.tipo_test,
        aciertos: Number(h.aciertos ?? 0),
        errores: Number(h.errores ?? 0),
        blancos: Number(h.blancos ?? 0),
        nota: Number(h.nota ?? 0),
        tiempoSegundos: Number(h.tiempo_segundos ?? 0),
      })),
    };
  },

  async getProgresoMaterias(userId, oposicionId) {
    const result = await pool.query(
      `SELECT
         m.id AS materia_id,
         m.nombre AS materia_nombre,
         COUNT(DISTINCT t.id)::int AS total_temas,
         COUNT(DISTINCT CASE WHEN (pu.aciertos + pu.errores) > 0 THEN pu.tema_id END)::int AS temas_practicados,
         COALESCE(ROUND(AVG(
           CASE WHEN (pu.aciertos + pu.errores) > 0
             THEN (pu.aciertos::numeric / (pu.aciertos + pu.errores)) * 100
           END
         )::numeric, 1), 0) AS porcentaje_acierto
       FROM materias m
       JOIN temas t ON t.materia_id = m.id
       LEFT JOIN progreso_usuario pu ON pu.tema_id = t.id AND pu.usuario_id = $1
       WHERE m.oposicion_id = $2
       GROUP BY m.id, m.nombre
       ORDER BY m.nombre ASC`,
      [userId, oposicionId],
    );

    return result.rows.map((row) => {
      const totalTemas = Number(row.total_temas ?? 0);
      const temasPracticados = Number(row.temas_practicados ?? 0);
      const maestria = totalTemas > 0 ? Number(((temasPracticados / totalTemas) * 100).toFixed(1)) : 0;
      return {
        materiaId: Number(row.materia_id),
        materiaNombre: row.materia_nombre,
        totalTemas,
        temasPracticados,
        maestria,
        porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
      };
    });
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
