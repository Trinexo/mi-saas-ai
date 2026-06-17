export const testSessionWriteEvaluateRepository = {
  async getTestById(client, testId) {
    const result = await client.query('SELECT id, usuario_id, estado FROM tests WHERE id = $1', [testId]);
    return result.rows[0] ?? null;
  },

  async getCorrectAnswersByTest(client, testId) {
    const result = await client.query(
      `SELECT tp.pregunta_id,
              o.id AS opcion_id,
              COUNT(all_options.id)::int AS total_opciones
       FROM tests_preguntas tp
       JOIN opciones_respuesta o ON o.pregunta_id = tp.pregunta_id AND o.correcta = TRUE
       JOIN opciones_respuesta all_options ON all_options.pregunta_id = tp.pregunta_id
       WHERE tp.test_id = $1
       GROUP BY tp.pregunta_id, o.id`,
      [testId],
    );

    return new Map(result.rows.map((row) => [
      Number(row.pregunta_id),
      {
        opcionId: Number(row.opcion_id),
        totalOpciones: Number(row.total_opciones),
      },
    ]));
  },

  async insertRespuesta(client, payload) {
    await client.query(
      `INSERT INTO respuestas_usuario (test_id, pregunta_id, respuesta_id, correcta)
       VALUES ($1, $2, $3, $4)`,
      [payload.testId, payload.preguntaId, payload.respuestaId, payload.correcta],
    );
  },

  async insertResultado(client, payload) {
    await client.query(
      `INSERT INTO resultados_test (test_id, aciertos, errores, blancos, nota, tiempo_segundos)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [payload.testId, payload.aciertos, payload.errores, payload.blancos, payload.nota, payload.tiempoSegundos],
    );
  },

  async markTestAsDone(client, testId) {
    await client.query('UPDATE tests SET estado = $2, fecha_fin = NOW() WHERE id = $1', [testId, 'finalizado']);
  },

  async updateProgress(client, { testId }) {
    await client.query(
      `WITH progreso_por_tema AS (
         SELECT
           t.usuario_id,
           COALESCE(p.tema_id, t.tema_id, b.tema_id) AS tema_id,
           CASE
             WHEN COUNT(DISTINCT COALESCE(p.bloque_id, t.bloque_id)) = 1
             THEN MAX(COALESCE(p.bloque_id, t.bloque_id))
             ELSE NULL
           END AS bloque_id,
           COUNT(*)::int AS preguntas_vistas,
           COUNT(*) FILTER (WHERE ru.correcta = TRUE)::int AS aciertos,
           COUNT(*) FILTER (WHERE ru.respuesta_id IS NOT NULL AND ru.correcta = FALSE)::int AS errores,
           GREATEST(1, ROUND(MAX(COALESCE(rt.tiempo_segundos, 0))::numeric / NULLIF(COUNT(*), 0)))::int AS tiempo_medio
         FROM tests t
         JOIN respuestas_usuario ru ON ru.test_id = t.id
         JOIN preguntas p ON p.id = ru.pregunta_id
         LEFT JOIN bloques b ON b.id = t.bloque_id
         LEFT JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.id = $1
         GROUP BY t.usuario_id, COALESCE(p.tema_id, t.tema_id, b.tema_id)
       )
       INSERT INTO progreso_usuario (usuario_id, tema_id, bloque_id, preguntas_vistas, aciertos, errores, tiempo_medio)
       SELECT usuario_id, tema_id, bloque_id, preguntas_vistas, aciertos, errores, tiempo_medio
       FROM progreso_por_tema
       WHERE tema_id IS NOT NULL
       ON CONFLICT (usuario_id, tema_id) WHERE tema_id IS NOT NULL
       DO UPDATE SET
         preguntas_vistas = progreso_usuario.preguntas_vistas + EXCLUDED.preguntas_vistas,
         aciertos = progreso_usuario.aciertos + EXCLUDED.aciertos,
         errores = progreso_usuario.errores + EXCLUDED.errores,
         tiempo_medio = GREATEST(1, ((progreso_usuario.tiempo_medio + EXCLUDED.tiempo_medio) / 2))`,
      [testId],
    );
  },
};
