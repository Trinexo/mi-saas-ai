import pool from '../config/db.js';

export const progressTemarioDetalleDetailRepository = {
  async getProgresoBloquesByTema(userId, temaId) {
    const result = await pool.query(
      `SELECT
         bl.id AS bloque_id,
         bl.nombre AS bloque_nombre,
         t.id AS tema_id_col,
         t.nombre AS tema_nombre,
         o.id AS oposicion_id,
         o.nombre AS oposicion_nombre,
         COUNT(DISTINCT p.id)::int AS total_preguntas,
         COALESCE(pu.aciertos, 0)::int AS aciertos,
         COALESCE(
           ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 1),
           0
         ) AS porcentaje_acierto,
         COUNT(DISTINCT CASE WHEN ru.correcta = true THEN ru.pregunta_id END)::int AS dominadas
       FROM colecciones bl
       JOIN temas t ON t.id = bl.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       LEFT JOIN preguntas p ON p.bloque_id = bl.id
       LEFT JOIN progreso_usuario pu ON pu.bloque_id = bl.id AND pu.usuario_id = $1
       LEFT JOIN tests ts ON ts.usuario_id = $1 AND ts.bloque_id = bl.id AND ts.estado = 'finalizado'
       LEFT JOIN respuestas_usuario ru ON ru.test_id = ts.id AND ru.pregunta_id = p.id
       WHERE bl.tema_id = $2
       GROUP BY bl.id, bl.nombre, t.id, t.nombre, o.id, o.nombre, pu.aciertos, pu.errores
       ORDER BY bl.nombre ASC`,
      [userId, temaId],
    );

    return result.rows.map((row) => {
      const totalPreguntas = Number(row.total_preguntas ?? 0);
      const dominadas = Number(row.dominadas ?? 0);
      const dominio = totalPreguntas > 0
        ? Number(((dominadas / totalPreguntas) * 100).toFixed(1))
        : 0;
      return {
        bloqueId: Number(row.bloque_id),
        bloqueNombre: row.bloque_nombre,
        temaId: Number(row.tema_id_col),
        temaNombre: row.tema_nombre,
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

  async getDetalleBloque(userId, bloqueId) {
    const [progresoResult, historialResult] = await Promise.all([
      pool.query(
        `SELECT
           bl.id AS bloque_id,
           bl.nombre AS bloque_nombre,
           t.id AS tema_id,
           t.nombre AS tema_nombre,
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
         FROM colecciones bl
         JOIN temas t ON t.id = bl.tema_id
         JOIN oposiciones o ON o.id = t.oposicion_id
         LEFT JOIN preguntas p ON p.bloque_id = bl.id
         LEFT JOIN progreso_usuario pu ON pu.bloque_id = bl.id AND pu.usuario_id = $1
         LEFT JOIN tests ts ON ts.usuario_id = $1 AND ts.bloque_id = bl.id AND ts.estado = 'finalizado'
         LEFT JOIN respuestas_usuario ru ON ru.test_id = ts.id AND ru.pregunta_id = p.id
         WHERE bl.id = $2
         GROUP BY bl.id, bl.nombre, t.id, t.nombre, o.id, o.nombre, pu.aciertos, pu.errores`,
        [userId, bloqueId],
      ),
      pool.query(
        `SELECT t.id AS test_id, t.fecha_creacion, t.tipo_test,
                rt.aciertos, rt.errores, rt.blancos, rt.nota, rt.tiempo_segundos
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.bloque_id = $2
           AND t.estado = 'finalizado'
         ORDER BY t.fecha_creacion DESC
         LIMIT 5`,
        [userId, bloqueId],
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
      bloqueId: Number(row.bloque_id),
      bloqueNombre: row.bloque_nombre,
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
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
