import pool from '../config/db.js';
import { appendOfficialQuestionFilter } from './questionOfficialFilter.js';

const SELECT_QUESTIONS_SQL = `
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad, p.imagen_url, p.audio_url,
         json_agg(json_build_object('id', o.id::text, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM preguntas p
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE p.estado = 'aprobada' AND p.tema_id = $1
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
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad, p.imagen_url, p.audio_url,
         json_agg(json_build_object('id', o.id::text, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM preguntas p
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE p.estado = 'aprobada' AND p.tema_id = $1
    AND ($4::text IS NULL OR p.nivel_dificultad = $4)
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
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad, p.imagen_url, p.audio_url,
         json_agg(json_build_object('id', o.id::text, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM preguntas p
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE p.estado = 'aprobada' AND p.tema_id = $1
    AND ($4::text IS NULL OR p.nivel_dificultad = $4)
    AND p.id != ALL($3::bigint[])
  GROUP BY p.id
  ORDER BY RANDOM()
  LIMIT $2
`;

export const testQuestionsThemeRepository = {
  async pickQuestions({ userId, temaId, numeroPreguntas, officialidad = 'all', anio = null, anioIds = [], examenId = null }) {
    const params = [temaId, userId, numeroPreguntas];
    const sql = SELECT_QUESTIONS_SQL.replace('AND p.tema_id = $1', `AND p.tema_id = $1${appendOfficialQuestionFilter({ officialidad, anio, anioIds, examenId }, params)}`);
    const result = await pool.query(sql, params);
    return result.rows;
  },

  async pickFreshQuestions({ userId, temaId, numeroPreguntas, nivelDificultad = null, officialidad = 'all', anio = null, anioIds = [], examenId = null }) {
    const params = [temaId, userId, numeroPreguntas, nivelDificultad];
    const sql = SELECT_FRESH_QUESTIONS_SQL.replace('AND p.tema_id = $1', `AND p.tema_id = $1${appendOfficialQuestionFilter({ officialidad, anio, anioIds, examenId }, params, 5)}`);
    const result = await pool.query(sql, params);
    return result.rows;
  },

  async pickAnyQuestions({ userId, temaId, numeroPreguntas, excludePreguntaIds = [], nivelDificultad = null, officialidad = 'all', anio = null, anioIds = [], examenId = null }) {
    const params = [temaId, numeroPreguntas, excludePreguntaIds, nivelDificultad];
    const sql = SELECT_ANY_QUESTIONS_SQL.replace('AND p.tema_id = $1', `AND p.tema_id = $1${appendOfficialQuestionFilter({ officialidad, anio, anioIds, examenId }, params, 5)}`);
    const result = await pool.query(sql, params);
    return result.rows;
  },
};
