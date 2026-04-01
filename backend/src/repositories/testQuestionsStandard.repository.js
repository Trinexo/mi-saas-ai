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

export const testQuestionsStandardRepository = {
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
};
