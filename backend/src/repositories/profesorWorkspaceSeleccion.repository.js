import pool from '../config/db.js';

const normalizeDificultad = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value).trim().toLowerCase();
  const map = {
    facil: 'facil',
    'fácil': 'facil',
    media: 'media',
    dificil: 'dificil',
    'difícil': 'dificil',
  };
  return map[text] ?? null;
};

export const profesorWorkspaceSeleccionRepository = {
  async listPreguntasDisponibles({ oposicionId, temaId, cantidad, dificultad, excludeIds }) {
    const nivel = normalizeDificultad(dificultad);
    const result = await pool.query(
      `SELECT p.id, p.enunciado, p.nivel_dificultad,
              t.id AS tema_id, t.nombre AS tema_nombre,
              o.id AS oposicion_id, o.nombre AS oposicion_nombre
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       WHERE o.id = $1
         AND t.id = $2
         AND ($3::text IS NULL OR p.nivel_dificultad = $3)
         AND NOT (p.id = ANY($4::bigint[]))
       ORDER BY random()
       LIMIT $5`,
      [oposicionId, temaId, nivel, excludeIds ?? [], cantidad],
    );
    return result.rows;
  },

  async listPreguntasDisponiblesOposicion({ oposicionId, cantidad, dificultad, excludeIds, excludeTemaIds }) {
    const nivel = normalizeDificultad(dificultad);
    const result = await pool.query(
      `SELECT p.id, p.enunciado, p.nivel_dificultad,
              t.id AS tema_id, t.nombre AS tema_nombre,
              o.id AS oposicion_id, o.nombre AS oposicion_nombre
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       WHERE o.id = $1
         AND ($2::text IS NULL OR p.nivel_dificultad = $2)
         AND NOT (p.id = ANY($3::bigint[]))
         AND NOT (t.id = ANY($4::bigint[]))
       ORDER BY random()
       LIMIT $5`,
      [oposicionId, nivel, excludeIds ?? [], excludeTemaIds ?? [], cantidad],
    );
    return result.rows;
  },

  async countDisponibles({ oposicionId, temaId, dificultad, excludeIds }) {
    const nivel = normalizeDificultad(dificultad);
    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       WHERE t.oposicion_id = $1
         AND t.id = $2
         AND ($3::text IS NULL OR p.nivel_dificultad = $3)
         AND NOT (p.id = ANY($4::bigint[]))`,
      [oposicionId, temaId, nivel, excludeIds ?? []],
    );
    return result.rows[0].total;
  },

  async listTemaIdsInOposicion(oposicionId, temaIds) {
    if (!temaIds?.length) return [];
    const result = await pool.query(
      `SELECT id
       FROM temas
       WHERE oposicion_id = $1 AND id = ANY($2::bigint[])`,
      [oposicionId, temaIds],
    );
    return result.rows.map((row) => Number(row.id));
  },

  async getPreguntasByPlantilla(plantillaTestId) {
    if (!plantillaTestId) return [];
    const result = await pool.query(
      `SELECT pregunta_id
       FROM admin_tests_preguntas
       WHERE test_id = $1`,
      [plantillaTestId],
    );
    return result.rows.map((row) => Number(row.pregunta_id));
  },

  async getPreguntasBySimulacro(simulacroId) {
    if (!simulacroId) return [];
    const result = await pool.query(
      `SELECT sp.pregunta_id
       FROM simulacros_preguntas sp
       JOIN simulacros_bloques sb ON sb.id = sp.bloque_id
       WHERE sb.simulacro_id = $1`,
      [simulacroId],
    );
    return result.rows.map((row) => Number(row.pregunta_id));
  },
};
