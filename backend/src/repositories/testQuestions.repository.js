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

const SELECT_SIMULACRO_QUESTIONS_SQL = `
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad,
         json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM preguntas p
  JOIN temas t ON t.id = p.tema_id
  JOIN materias m ON m.id = t.materia_id
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE m.oposicion_id = $1
  GROUP BY p.id
  ORDER BY RANDOM()
  LIMIT $2
`;

const SELECT_MARCADAS_QUESTIONS_SQL = `
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad,
         json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM preguntas_marcadas pm
  JOIN preguntas p ON p.id = pm.pregunta_id
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE pm.usuario_id = $1
  GROUP BY p.id
  ORDER BY RANDOM()
  LIMIT $2
`;

const SELECT_REFUERZO_QUESTIONS_SQL = `
  WITH failed AS (
    SELECT ru.pregunta_id, COUNT(*) AS cnt
    FROM respuestas_usuario ru
    JOIN tests ts ON ts.id = ru.test_id
    WHERE ts.usuario_id = $1
      AND ru.correcta = FALSE
    GROUP BY ru.pregunta_id
    ORDER BY cnt DESC, MAX(ru.fecha_respuesta) DESC
    LIMIT 200
  )
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad,
         json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM failed f
  JOIN preguntas p ON p.id = f.pregunta_id
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE ($3::bigint IS NULL OR p.tema_id = $3)
  GROUP BY p.id, f.cnt
  ORDER BY f.cnt DESC, RANDOM()
  LIMIT $2
`;

export const testQuestionsRepository = {
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

  async pickSimulacroQuestions({ oposicionId, numeroPreguntas }) {
    const result = await pool.query(SELECT_SIMULACRO_QUESTIONS_SQL, [oposicionId, numeroPreguntas]);
    return result.rows;
  },

  async pickMarcadasQuestions({ userId, numeroPreguntas }) {
    const result = await pool.query(SELECT_MARCADAS_QUESTIONS_SQL, [userId, numeroPreguntas]);
    return result.rows;
  },

  async pickRefuerzoQuestions({ userId, numeroPreguntas, temaId = null }) {
    const result = await pool.query(SELECT_REFUERZO_QUESTIONS_SQL, [userId, numeroPreguntas, temaId]);
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
};
