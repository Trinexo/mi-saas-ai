import pool from '../config/db.js';

export const progressTemarioDetalleDetailRepository = {
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
         COALESCE(pu.aciertos, 0)::int AS aciertos,
         COALESCE(
           ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 1),
           0
         ) AS porcentaje_acierto,
         COUNT(DISTINCT CASE WHEN ru.correcta = true THEN ru.pregunta_id END)::int AS dominadas
       FROM temas t
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       LEFT JOIN preguntas p ON p.tema_id = t.id
       LEFT JOIN progreso_usuario pu ON pu.tema_id = t.id AND pu.usuario_id = $1
       LEFT JOIN tests ts ON ts.usuario_id = $1 AND ts.tema_id = t.id AND ts.estado = 'finalizado'
       LEFT JOIN respuestas_usuario ru ON ru.test_id = ts.id AND ru.pregunta_id = p.id
       WHERE t.materia_id = $2
       GROUP BY t.id, t.nombre, m.id, m.nombre, o.id, o.nombre, pu.aciertos, pu.errores
       ORDER BY t.nombre ASC`,
      [userId, materiaId],
    );

    return result.rows.map((row) => {
      const totalPreguntas = Number(row.total_preguntas ?? 0);
      const dominadas = Number(row.dominadas ?? 0);
      const dominio = totalPreguntas > 0
        ? Number(((dominadas / totalPreguntas) * 100).toFixed(1))
        : 0;
      return {
        temaId: Number(row.tema_id),
        temaNombre: row.tema_nombre,
        materiaId: Number(row.materia_id_col),
        materiaNombre: row.materia_nombre,
        oposicionId: Number(row.oposicion_id),
        oposicionNombre: row.oposicion_nombre,
        totalPreguntas,
        dominadas,
        dominio,
        aciertos: Number(row.aciertos ?? 0),
        porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
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
           COUNT(DISTINCT ru.pregunta_id)::int AS respondidas_unicas,
           COUNT(DISTINCT CASE WHEN ru.correcta = true THEN ru.pregunta_id END)::int AS dominadas,
           COALESCE(
             ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 1),
             0
           ) AS porcentaje_acierto
         FROM temas t
         JOIN materias m ON m.id = t.materia_id
         JOIN oposiciones o ON o.id = m.oposicion_id
         LEFT JOIN preguntas p ON p.tema_id = t.id
         LEFT JOIN progreso_usuario pu ON pu.tema_id = t.id AND pu.usuario_id = $1
         LEFT JOIN tests ts ON ts.usuario_id = $1 AND ts.tema_id = t.id AND ts.estado = 'finalizado'
         LEFT JOIN respuestas_usuario ru ON ru.test_id = ts.id AND ru.pregunta_id = p.id
         WHERE t.id = $2
         GROUP BY t.id, t.nombre, m.id, m.nombre, o.id, o.nombre, pu.aciertos, pu.errores`,
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
    const respondidas = Number(row.respondidas_unicas ?? 0);
    const dominadas = Number(row.dominadas ?? 0);
    const dominio = totalPreguntas > 0
      ? Number(((dominadas / totalPreguntas) * 100).toFixed(1))
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
      dominadas,
      dominio,
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
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
};
