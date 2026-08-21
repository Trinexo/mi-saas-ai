import pool from '../config/db.js';
import { appendOfficialQuestionFilter } from './questionOfficialFilter.js';

const SELECT_SIMULACRO_QUESTIONS_SQL = `
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad, p.imagen_url, p.audio_url,
         json_agg(json_build_object('id', o.id::text, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM preguntas p
  JOIN temas t ON t.id = p.tema_id
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE p.estado = 'aprobada' AND t.oposicion_id = $1
  GROUP BY p.id
  ORDER BY RANDOM()
  LIMIT $2
`;

const SELECT_MARCADAS_QUESTIONS_SQL = `
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad, p.imagen_url, p.audio_url,
         json_agg(json_build_object('id', o.id::text, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM preguntas_marcadas pm
  JOIN preguntas p ON p.id = pm.pregunta_id
  JOIN temas t ON t.id = p.tema_id
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE p.estado = 'aprobada'
    AND pm.usuario_id = $1
    AND t.oposicion_id = $3
  GROUP BY p.id
  ORDER BY RANDOM()
  LIMIT $2
`;

const SELECT_DUE_QUESTIONS_SQL = `
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad, p.imagen_url, p.audio_url,
         json_agg(json_build_object('id', o.id::text, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM repeticion_espaciada re
  JOIN preguntas p ON p.id = re.pregunta_id
  JOIN temas t ON t.id = p.tema_id
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE p.estado = 'aprobada'
    AND re.usuario_id = $1
    AND re.proxima_revision <= NOW()
    AND ($3::bigint IS NULL OR p.tema_id = $3)
    AND ($4::bigint IS NULL OR p.bloque_id = $4)
    AND ($5::bigint IS NULL OR t.oposicion_id = $5)
  GROUP BY p.id, re.proxima_revision
  ORDER BY re.proxima_revision ASC
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
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad, p.imagen_url, p.audio_url,
         json_agg(json_build_object('id', o.id::text, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM failed f
  JOIN preguntas p ON p.id = f.pregunta_id
  JOIN temas t ON t.id = p.tema_id
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE p.estado = 'aprobada'
    AND ($3::bigint IS NULL OR p.tema_id = $3)
    AND ($4::bigint IS NULL OR t.oposicion_id = $4)
  GROUP BY p.id, f.cnt
  ORDER BY f.cnt DESC, RANDOM()
  LIMIT $2
`;

export const testQuestionsSpecialRepository = {
  async pickSimulacroQuestions({ oposicionId, numeroPreguntas, officialidad = 'all', anio = null, anioIds = [], examenId = null }) {
    const params = [oposicionId, numeroPreguntas];
    const sql = SELECT_SIMULACRO_QUESTIONS_SQL.replace('AND t.oposicion_id = $1', `AND t.oposicion_id = $1${appendOfficialQuestionFilter({ officialidad, anio, anioIds, examenId }, params)}`);
    const result = await pool.query(sql, params);
    return result.rows;
  },

  async pickMarcadasQuestions({ userId, oposicionId, numeroPreguntas, officialidad = 'all', anio = null, anioIds = [], examenId = null }) {
    const params = [userId, numeroPreguntas, oposicionId];
    const sql = SELECT_MARCADAS_QUESTIONS_SQL.replace('AND t.oposicion_id = $3', `AND t.oposicion_id = $3${appendOfficialQuestionFilter({ officialidad, anio, anioIds, examenId }, params, 4)}`);
    const result = await pool.query(sql, params);
    return result.rows;
  },

  async pickDueQuestions({ userId, temaId = null, bloqueId = null, oposicionId = null, numeroPreguntas, officialidad = 'all', anio = null, anioIds = [], examenId = null }) {
    const params = [
      userId,
      numeroPreguntas,
      temaId ?? null,
      bloqueId ?? null,
      oposicionId ?? null,
    ];
    const sql = SELECT_DUE_QUESTIONS_SQL.replace('AND ($5::bigint IS NULL OR t.oposicion_id = $5)', `AND ($5::bigint IS NULL OR t.oposicion_id = $5)${appendOfficialQuestionFilter({ officialidad, anio, anioIds, examenId }, params, 6)}`);
    const result = await pool.query(sql, params);
    return result.rows;
  },

  async pickRefuerzoQuestions({ userId, numeroPreguntas, temaId = null, oposicionId = null, officialidad = 'all', anio = null, anioIds = [], examenId = null }) {
    const params = [userId, numeroPreguntas, temaId, oposicionId];
    const sql = SELECT_REFUERZO_QUESTIONS_SQL.replace('AND ($4::bigint IS NULL OR t.oposicion_id = $4)', `AND ($4::bigint IS NULL OR t.oposicion_id = $4)${appendOfficialQuestionFilter({ officialidad, anio, anioIds, examenId }, params, 5)}`);
    const result = await pool.query(sql, params);
    return result.rows;
  },

  async getOpcionesCorrectasByPreguntaIds(preguntaIds) {
    if (!preguntaIds || preguntaIds.length === 0) return {};
    const result = await pool.query(
      'SELECT pregunta_id, id::text AS opcion_id FROM opciones_respuesta WHERE pregunta_id = ANY($1::bigint[]) AND correcta = TRUE',
      [preguntaIds],
    );
    return Object.fromEntries(result.rows.map((r) => [r.pregunta_id, r.opcion_id]));
  },
};
