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

export const testQuestionsThemeRepository = {
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
};
