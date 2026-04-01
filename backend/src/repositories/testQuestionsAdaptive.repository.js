import pool from '../config/db.js';

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

export const testQuestionsAdaptiveRepository = {
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
};
