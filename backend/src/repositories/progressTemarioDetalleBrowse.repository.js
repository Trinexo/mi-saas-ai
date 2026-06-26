import pool from '../config/db.js';

export const progressTemarioDetalleBrowseRepository = {
  async getProgresoBloques(userId, oposicionId, options = {}) {
    const { modoPreparacion = 'experto', albacerModuloId = null } = options ?? {};
    const conditions = [
      'ts.usuario_id = $1',
      "ts.estado = 'finalizado'",
      'ts.modo_preparacion = $2',
      '($3::bigint IS NULL OR ts.albacer_modulo_id = $3)',
    ];
    const params = [userId, modoPreparacion, albacerModuloId];
    if (oposicionId) {
      conditions.push(`t.oposicion_id = $${params.length + 1}`);
      params.push(oposicionId);
    }
    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
         bl.id AS bloque_id,
         bl.nombre AS bloque_nombre,
         t.id AS tema_id,
         t.nombre AS tema_nombre,
         o.id AS oposicion_id,
         o.nombre AS oposicion_nombre,
         COUNT(ru.id) FILTER (WHERE ru.correcta = true)::int AS aciertos,
         COUNT(ru.id) FILTER (WHERE ru.correcta = false)::int AS errores,
         COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NOT NULL)::int AS total_respondidas,
         COALESCE(ROUND(
           100.0 * COUNT(ru.id) FILTER (WHERE ru.correcta = true)::numeric
           / NULLIF(COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NOT NULL), 0)
         , 1), 0) AS porcentaje_acierto
       FROM tests ts
       JOIN respuestas_usuario ru ON ru.test_id = ts.id
       JOIN preguntas p ON p.id = ru.pregunta_id
       JOIN bloques bl ON bl.id = p.bloque_id
       JOIN temas t ON t.id = bl.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       WHERE ${where}
       GROUP BY bl.id, bl.nombre, t.id, t.nombre, o.id, o.nombre
       HAVING COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NOT NULL) > 0
       ORDER BY t.nombre ASC, porcentaje_acierto ASC NULLS FIRST`,
      params,
    );

    return result.rows.map((row) => ({
      bloqueId: Number(row.bloque_id),
      bloqueNombre: row.bloque_nombre,
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      oposicionId: Number(row.oposicion_id),
      oposicionNombre: row.oposicion_nombre,
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      totalRespondidas: Number(row.total_respondidas ?? 0),
      porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
    }));
  },

  async getProgresoTemas(userId, oposicionId, options = {}) {
    const { modoPreparacion = 'experto', albacerModuloId = null } = options ?? {};
    const result = await pool.query(
      `SELECT
         t.id AS tema_id,
         t.nombre AS tema_nombre,
         COUNT(DISTINCT p.id)::int AS total_preguntas,
         COUNT(DISTINCT CASE WHEN ru.id IS NOT NULL THEN p.id END)::int AS preguntas_practicadas,
         COUNT(DISTINCT CASE WHEN ru.correcta = true THEN ru.pregunta_id END)::int AS dominadas,
         COALESCE(ROUND(
           100.0 * COUNT(ru.id) FILTER (WHERE ru.correcta = true)::numeric
           / NULLIF(COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NOT NULL), 0)
         , 1), 0) AS porcentaje_acierto
       FROM temas t
       LEFT JOIN preguntas p ON p.tema_id = t.id
       LEFT JOIN tests ts ON ts.usuario_id = $1
         AND ts.estado = 'finalizado'
         AND ts.modo_preparacion = $3
         AND ($4::bigint IS NULL OR ts.albacer_modulo_id = $4)
       LEFT JOIN respuestas_usuario ru ON ru.test_id = ts.id AND ru.pregunta_id = p.id
       WHERE t.oposicion_id = $2
       GROUP BY t.id, t.nombre
       ORDER BY t.nombre ASC`,
      [userId, oposicionId, modoPreparacion, albacerModuloId],
    );

    return result.rows.map((row) => {
      const totalPreguntas = Number(row.total_preguntas ?? 0);
      const dominadas = Number(row.dominadas ?? 0);
      const dominio = totalPreguntas > 0 ? Number(((dominadas / totalPreguntas) * 100).toFixed(1)) : 0;
      return {
        temaId: Number(row.tema_id),
        temaNombre: row.tema_nombre,
        totalBloques: totalPreguntas,
        bloquesPracticados: Number(row.preguntas_practicadas ?? 0),
        totalPreguntas,
        dominadas,
        dominio,
        porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
      };
    });
  },

  async getProgresoTemasReal(userId, oposicionId, options = {}) {
    const { modoPreparacion = 'experto', albacerModuloId = null } = options ?? {};
    const result = await pool.query(
      `SELECT
         te.id AS tema_id,
         te.nombre AS tema_nombre,
         COUNT(DISTINCT p.id)::int AS total_preguntas,
         COUNT(DISTINCT ru.pregunta_id) FILTER (WHERE ru.respuesta_id IS NOT NULL)::int AS preguntas_respondidas,
         COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NOT NULL)::int AS intentos,
         COUNT(ru.id) FILTER (WHERE ru.correcta = true)::int AS aciertos,
         COUNT(ru.id) FILTER (WHERE ru.correcta = false)::int AS errores,
         COALESCE(ROUND(
           100.0 * COUNT(ru.id) FILTER (WHERE ru.correcta = true)::numeric
           / NULLIF(COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NOT NULL), 0)
         , 1), 0) AS porcentaje_acierto
       FROM temas te
       LEFT JOIN preguntas p ON p.tema_id = te.id
       LEFT JOIN respuestas_usuario ru ON ru.pregunta_id = p.id
         AND EXISTS (
           SELECT 1 FROM tests ts
           WHERE ts.id = ru.test_id
             AND ts.usuario_id = $1
             AND ts.estado = 'finalizado'
             AND ts.modo_preparacion = $3
             AND ($4::bigint IS NULL OR ts.albacer_modulo_id = $4)
         )
       WHERE te.oposicion_id = $2
       GROUP BY te.id, te.nombre
       ORDER BY te.nombre ASC`,
      [userId, oposicionId, modoPreparacion, albacerModuloId],
    );
    return result.rows.map((row) => ({
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      totalPreguntas: Number(row.total_preguntas ?? 0),
      preguntasRespondidas: Number(row.preguntas_respondidas ?? 0),
      intentos: Number(row.intentos ?? 0),
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
    }));
  },

  async getProgresoTemaReal(userId, temaId, options = {}) {
    const { modoPreparacion = 'experto', albacerModuloId = null } = options ?? {};
    const result = await pool.query(
      `SELECT
         te.id AS tema_id,
         te.nombre AS tema_nombre,
         o.id AS oposicion_id,
         o.nombre AS oposicion_nombre,
         COUNT(DISTINCT p.id)::int AS total_preguntas,
         COUNT(DISTINCT ru.pregunta_id) FILTER (WHERE ru.respuesta_id IS NOT NULL)::int AS preguntas_respondidas,
         COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NOT NULL)::int AS intentos,
         COUNT(ru.id) FILTER (WHERE ru.correcta = true)::int AS aciertos,
         COUNT(ru.id) FILTER (WHERE ru.correcta = false)::int AS errores,
         COALESCE(ROUND(
           100.0 * COUNT(ru.id) FILTER (WHERE ru.correcta = true)::numeric
           / NULLIF(COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NOT NULL), 0)
         , 1), 0) AS porcentaje_acierto
       FROM temas te
       JOIN oposiciones o ON o.id = te.oposicion_id
       LEFT JOIN preguntas p ON p.tema_id = te.id
       LEFT JOIN respuestas_usuario ru ON ru.pregunta_id = p.id
         AND EXISTS (
           SELECT 1 FROM tests ts
           WHERE ts.id = ru.test_id
             AND ts.usuario_id = $1
             AND ts.estado = 'finalizado'
             AND ts.modo_preparacion = $3
             AND ($4::bigint IS NULL OR ts.albacer_modulo_id = $4)
         )
       WHERE te.id = $2
       GROUP BY te.id, te.nombre, o.id, o.nombre`,
      [userId, temaId, modoPreparacion, albacerModuloId],
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      oposicionId: Number(row.oposicion_id),
      oposicionNombre: row.oposicion_nombre,
      totalPreguntas: Number(row.total_preguntas ?? 0),
      preguntasRespondidas: Number(row.preguntas_respondidas ?? 0),
      intentos: Number(row.intentos ?? 0),
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
    };
  },
};
