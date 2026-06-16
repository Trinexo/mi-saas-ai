import pool from '../config/db.js';

export const misTestsRepository = {
  /**
   * Devuelve plantillas de test publicadas para una lista de oposicionIds.
   * Agrupa por tema para que el frontend pueda ordenarlas.
   */
  async getPublicados(oposicionIds, plan = 'free') {
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
              COALESCE(tt.temas_resumen, te.nombre) AS temas_resumen,
              COALESCE(tt.tema_ids, CASE WHEN at.tema_id IS NULL THEN ARRAY[]::bigint[] ELSE ARRAY[at.tema_id] END) AS tema_ids,
              COUNT(DISTINCT atp.pregunta_id)::int AS total_preguntas
       FROM admin_tests at
       LEFT JOIN oposiciones o  ON o.id  = at.oposicion_id
       LEFT JOIN temas te       ON te.id = at.tema_id
       LEFT JOIN LATERAL (
         SELECT
           ARRAY_AGG(att.tema_id ORDER BY tm.nombre, tm.id) AS tema_ids,
           STRING_AGG(tm.nombre, ' | ' ORDER BY tm.nombre, tm.id) AS temas_resumen
         FROM admin_tests_temas att
         JOIN temas tm ON tm.id = att.tema_id
         WHERE att.test_id = at.id
       ) tt ON TRUE
       LEFT JOIN admin_tests_preguntas atp ON atp.test_id = at.id
       WHERE at.oposicion_id = ANY($1)
         AND at.estado = 'publicado'
         AND (at.es_demo = FALSE OR $2 = 'free')
       GROUP BY at.id, o.nombre, te.nombre, tt.temas_resumen, tt.tema_ids
       ORDER BY COALESCE(tt.temas_resumen, te.nombre) ASC NULLS LAST, at.nombre ASC`,
      [oposicionIds, plan],
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

    const temasRes = await pool.query(
      `SELECT t.id, t.nombre
       FROM admin_tests_temas att
       JOIN temas t ON t.id = att.tema_id
       WHERE att.test_id = $1
       ORDER BY t.nombre ASC, t.id ASC`,
      [testId],
    );
    test.temas = temasRes.rows;

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
