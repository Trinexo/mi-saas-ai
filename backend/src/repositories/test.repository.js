import pool from '../config/db.js';

const SELECT_QUESTIONS_SQL = `
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad,
         json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM preguntas p
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE p.tema_id = $1
    AND p.id NOT IN (
      SELECT tp.pregunta_id
      FROM tests t
      JOIN tests_preguntas tp ON tp.test_id = t.id
      WHERE t.usuario_id = $2
      ORDER BY t.fecha_creacion DESC
      LIMIT 200
    )
  GROUP BY p.id
  ORDER BY RANDOM()
  LIMIT $3
`;

const SELECT_FRESH_QUESTIONS_SQL = `
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad,
         json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM preguntas p
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE p.tema_id = $1
    AND ($4::int IS NULL OR p.nivel_dificultad = $4)
    AND p.id NOT IN (
      SELECT tp.pregunta_id
      FROM tests t
      JOIN tests_preguntas tp ON tp.test_id = t.id
      WHERE t.usuario_id = $2
      ORDER BY t.fecha_creacion DESC
      LIMIT 200
    )
  GROUP BY p.id
  ORDER BY RANDOM()
  LIMIT $3
`;

const SELECT_ANY_QUESTIONS_SQL = `
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad,
         json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM preguntas p
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE p.tema_id = $1
    AND ($4::int IS NULL OR p.nivel_dificultad = $4)
    AND p.id != ALL($3::bigint[])
  GROUP BY p.id
  ORDER BY RANDOM()
  LIMIT $2
`;

const SELECT_DUE_QUESTIONS_SQL = `
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad,
         json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM repeticion_espaciada re
  JOIN preguntas p ON p.id = re.pregunta_id
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE re.usuario_id = $1
    AND p.tema_id = $2
    AND re.proxima_revision <= NOW()
  GROUP BY p.id, re.proxima_revision
  ORDER BY re.proxima_revision ASC
  LIMIT $3
`;

const COUNT_DUE_QUESTIONS_SQL = `
  SELECT COUNT(*)::int AS total
  FROM repeticion_espaciada re
  JOIN preguntas p ON p.id = re.pregunta_id
  WHERE re.usuario_id = $1
    AND p.tema_id = $2
    AND re.proxima_revision <= NOW()
`;

const SELECT_ADAPTIVE_QUESTIONS_SQL = `
  SELECT
    p.id,
    p.enunciado,
    p.explicacion,
    p.nivel_dificultad,
    (
      SELECT json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id)
      FROM opciones_respuesta o
      WHERE o.pregunta_id = p.id
    ) AS opciones,
    COALESCE(
      CASE WHEN ru.correcta = false THEN 3
           WHEN ru.correcta = true  THEN -1
           ELSE 0
      END
      +
      CASE WHEN ru.fecha_respuesta > NOW() - INTERVAL '7 days' THEN -2
           ELSE 0
      END,
      0
    ) AS score
  FROM preguntas p
  LEFT JOIN LATERAL (
    SELECT ru.correcta, ru.fecha_respuesta
    FROM respuestas_usuario ru
    JOIN tests t ON t.id = ru.test_id
    WHERE ru.pregunta_id = p.id AND t.usuario_id = $1
    ORDER BY ru.fecha_respuesta DESC
    LIMIT 1
  ) ru ON true
  WHERE p.tema_id = $2
    AND p.id != ALL($3::bigint[])
    AND ($5::int IS NULL OR p.nivel_dificultad = $5)
  ORDER BY score DESC, RANDOM()
  LIMIT $4
`;

export const testRepository = {
  async pickQuestions({ userId, temaId, numeroPreguntas }) {
    const result = await pool.query(SELECT_QUESTIONS_SQL, [temaId, userId, numeroPreguntas]);
    return result.rows;
  },

  async pickFreshQuestions({ userId, temaId, numeroPreguntas, nivelDificultad = null }) {
    const result = await pool.query(SELECT_FRESH_QUESTIONS_SQL, [temaId, userId, numeroPreguntas, nivelDificultad]);
    return result.rows;
  },

  async pickAnyQuestions({ userId, temaId, numeroPreguntas, excludePreguntaIds = [], nivelDificultad = null }) {
    const result = await pool.query(SELECT_ANY_QUESTIONS_SQL, [temaId, numeroPreguntas, excludePreguntaIds, nivelDificultad]);
    return result.rows;
  },

  async pickAdaptiveQuestions({ userId, temaId, numeroPreguntas, excludePreguntaIds = [], nivelDificultad = null }) {
    const result = await pool.query(SELECT_ADAPTIVE_QUESTIONS_SQL, [userId, temaId, excludePreguntaIds, numeroPreguntas, nivelDificultad]);
    return result.rows;
  },

  async pickDueQuestions({ userId, temaId, numeroPreguntas }) {
    const result = await pool.query(SELECT_DUE_QUESTIONS_SQL, [userId, temaId, numeroPreguntas]);
    return result.rows;
  },

  async countDueQuestions({ userId, temaId }) {
    const result = await pool.query(COUNT_DUE_QUESTIONS_SQL, [userId, temaId]);
    return result.rows[0].total;
  },

  async getUserHistory({ userId, limit }) {
    const result = await pool.query(
      `SELECT t.id, t.tema_id, te.nombre AS tema_nombre, t.numero_preguntas,
              t.estado, t.fecha_creacion, t.tipo_test,
              rt.aciertos, rt.errores, rt.blancos, rt.nota, rt.tiempo_segundos
       FROM tests t
       LEFT JOIN temas te ON te.id = t.tema_id
       LEFT JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1 AND t.estado = 'finalizado'
       ORDER BY t.fecha_creacion DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  },

  async getTestReview(userId, testId) {
    const testResult = await pool.query(
      `SELECT t.id, t.tema_id, te.nombre AS tema_nombre, t.numero_preguntas,
              t.tipo_test, t.fecha_creacion,
              rt.aciertos, rt.errores, rt.blancos, rt.nota, rt.tiempo_segundos
       FROM tests t
       LEFT JOIN temas te ON te.id = t.tema_id
       LEFT JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.id = $1 AND t.usuario_id = $2`,
      [testId, userId],
    );
    if (!testResult.rows[0]) return null;

    const preguntasResult = await pool.query(
      `SELECT p.id AS pregunta_id, p.enunciado, p.explicacion,
              ru.respuesta_id AS elegida_id, ru.correcta,
              (SELECT o2.id FROM opciones_respuesta o2 WHERE o2.pregunta_id = p.id AND o2.correcta = TRUE LIMIT 1) AS correcta_id,
              json_agg(json_build_object('id', o.id, 'texto', o.texto, 'correcta', o.correcta) ORDER BY o.id) AS opciones
       FROM tests_preguntas tp
       JOIN preguntas p ON p.id = tp.pregunta_id
       JOIN opciones_respuesta o ON o.pregunta_id = p.id
       LEFT JOIN respuestas_usuario ru ON ru.test_id = tp.test_id AND ru.pregunta_id = tp.pregunta_id
       WHERE tp.test_id = $1
       GROUP BY p.id, ru.respuesta_id, ru.correcta
       ORDER BY tp.orden`,
      [testId],
    );
    return { test: testResult.rows[0], preguntas: preguntasResult.rows };
  },

  async getTestConfig(userId, testId) {
    const result = await pool.query(
      `SELECT t.id, t.tema_id, t.numero_preguntas, t.tipo_test, t.estado,
              json_agg(json_build_object('id', p.id, 'enunciado', p.enunciado, 'nivel_dificultad', p.nivel_dificultad,
                'opciones', (
                  SELECT json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id)
                  FROM opciones_respuesta o WHERE o.pregunta_id = p.id
                )) ORDER BY tp.orden) AS preguntas
       FROM tests t
       JOIN tests_preguntas tp ON tp.test_id = t.id
       JOIN preguntas p ON p.id = tp.pregunta_id
       WHERE t.id = $1 AND t.usuario_id = $2
       GROUP BY t.id`,
      [testId, userId],
    );
    return result.rows[0] ?? null;
  },

  async createTest({ userId, temaId, numeroPreguntas }) {
    const result = await pool.query(
      `INSERT INTO tests (usuario_id, tema_id, tipo_test, numero_preguntas, estado)
       VALUES ($1, $2, 'tema', $3, 'generado')
       RETURNING id`,
      [userId, temaId, numeroPreguntas],
    );
    return result.rows[0];
  },

  async insertTestPreguntas(testId, preguntaIds) {
    const values = preguntaIds.map((preguntaId, index) => `($1, ${preguntaId}, ${index + 1})`).join(',');
    await pool.query(`INSERT INTO tests_preguntas (test_id, pregunta_id, orden) VALUES ${values}`, [testId]);
  },

  async getTestById(client, testId) {
    const result = await client.query('SELECT id, usuario_id, estado FROM tests WHERE id = $1', [testId]);
    return result.rows[0] ?? null;
  },

  async getCorrectAnswersByTest(client, testId) {
    const result = await client.query(
      `SELECT tp.pregunta_id, o.id AS opcion_id
       FROM tests_preguntas tp
       JOIN opciones_respuesta o ON o.pregunta_id = tp.pregunta_id AND o.correcta = TRUE
       WHERE tp.test_id = $1`,
      [testId],
    );

    return new Map(result.rows.map((row) => [Number(row.pregunta_id), Number(row.opcion_id)]));
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
    await client.query('UPDATE tests SET estado = $2 WHERE id = $1', [testId, 'finalizado']);
  },

  async updateProgress(client, { testId }) {
    await client.query(
      `INSERT INTO progreso_usuario (usuario_id, tema_id, preguntas_vistas, aciertos, errores, tiempo_medio)
    SELECT t.usuario_id,
      t.tema_id,
      t.numero_preguntas AS preguntas_vistas,
      rt.aciertos,
      rt.errores,
      rt.tiempo_segundos AS tiempo_medio
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
    WHERE t.id = $1
       ON CONFLICT (usuario_id, tema_id)
       DO UPDATE SET
         preguntas_vistas = progreso_usuario.preguntas_vistas + EXCLUDED.preguntas_vistas,
         aciertos = progreso_usuario.aciertos + EXCLUDED.aciertos,
         errores = progreso_usuario.errores + EXCLUDED.errores,
         tiempo_medio = GREATEST(1, ((progreso_usuario.tiempo_medio + EXCLUDED.tiempo_medio) / 2))`,
      [testId],
    );
  },
};