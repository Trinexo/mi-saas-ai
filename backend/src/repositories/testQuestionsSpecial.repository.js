import pool from '../config/db.js';

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

export const testQuestionsSpecialRepository = {
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
