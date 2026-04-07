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
};
