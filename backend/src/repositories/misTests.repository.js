import pool from '../config/db.js';

export const misTestsRepository = {
  /**
   * Devuelve plantillas de test publicadas para una lista de oposicionIds.
   * Agrupa por tema para que el frontend pueda ordenarlas.
   */
  async getPublicados(oposicionIds) {
    if (!oposicionIds.length) return [];
    const result = await pool.query(
      `SELECT at.id,
              at.nombre,
              at.descripcion,
              at.nivel_dificultad,
              at.duracion_minutos,
              at.oposicion_id,
              at.tema_id,
              o.nombre  AS oposicion_nombre,
              te.nombre AS tema_nombre,
              COUNT(DISTINCT atp.pregunta_id)::int AS total_preguntas
       FROM admin_tests at
       LEFT JOIN oposiciones o  ON o.id  = at.oposicion_id
       LEFT JOIN temas te       ON te.id = at.tema_id
       LEFT JOIN admin_tests_preguntas atp ON atp.test_id = at.id
       WHERE at.oposicion_id = ANY($1)
         AND at.estado = 'publicado'
       GROUP BY at.id, o.nombre, te.nombre
       ORDER BY te.nombre ASC NULLS LAST, at.nombre ASC`,
      [oposicionIds],
    );
    return result.rows;
  },

  /**
   * Devuelve los datos de un test publicado y sus preguntas con opciones.
   */
  async getTestConPreguntas(testId) {
    const testRes = await pool.query(
      `SELECT at.id, at.nombre, at.descripcion, at.nivel_dificultad,
              at.duracion_minutos, at.oposicion_id, at.tema_id
       FROM admin_tests at
       WHERE at.id = $1 AND at.estado = 'publicado'`,
      [testId],
    );
    if (!testRes.rows.length) return null;
    const test = testRes.rows[0];

    const preguntasRes = await pool.query(
      `SELECT p.id, p.enunciado, p.nivel_dificultad, p.imagen_url, p.audio_url,
              json_agg(
                json_build_object('id', op.id, 'texto', op.texto)
              ) AS opciones
       FROM admin_tests_preguntas atp
       JOIN preguntas p  ON p.id  = atp.pregunta_id
       JOIN opciones_respuesta op  ON op.pregunta_id = p.id
       WHERE atp.test_id = $1
       GROUP BY p.id
       ORDER BY MIN(atp.orden)`,
      [testId],
    );
    return { test, preguntas: preguntasRes.rows };
  },
};
