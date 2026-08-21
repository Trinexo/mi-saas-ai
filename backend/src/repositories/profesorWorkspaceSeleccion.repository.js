import pool from '../config/db.js';

const appendOfficialFilters = ({ officialidad = 'all', anioIds = [], examenId = null, examenIds = [] }, params, where) => {
  if (officialidad === 'official') where.push('EXISTS (SELECT 1 FROM preguntas_anios_oficiales pao WHERE pao.pregunta_id = p.id)');
  if (officialidad === 'non_official') where.push('NOT EXISTS (SELECT 1 FROM preguntas_anios_oficiales pao WHERE pao.pregunta_id = p.id)');
  if (anioIds?.length) {
    params.push(anioIds);
    where.push(`EXISTS (SELECT 1 FROM preguntas_anios_oficiales pao WHERE pao.pregunta_id = p.id AND pao.oposicion_anio_id = ANY($${params.length}::bigint[]))`);
  }
  const selectedExamenIds = examenIds?.length ? examenIds : (examenId != null ? [examenId] : []);
  if (selectedExamenIds.length) {
    params.push(selectedExamenIds);
    where.push(`EXISTS (SELECT 1 FROM examenes_oficiales_preguntas eop WHERE eop.pregunta_id = p.id AND eop.examen_id = ANY($${params.length}::bigint[]))`);
  }
};

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
  async listPreguntasDisponibles({ oposicionId, temaId, cantidad, dificultad, excludeIds, officialidad, anioIds, examenId, examenIds }) {
    const nivel = normalizeDificultad(dificultad);
    const params = [oposicionId, temaId, nivel, excludeIds ?? []];
    const where = [
      `p.estado = 'aprobada'`, `o.id = $1`, `t.id = $2`,
      `($3::text IS NULL OR p.nivel_dificultad = $3)`, `NOT (p.id = ANY($4::bigint[]))`,
    ];
    appendOfficialFilters({ officialidad, anioIds, examenId, examenIds }, params, where);
    params.push(cantidad);
    const result = await pool.query(
      `SELECT p.id, p.enunciado, p.nivel_dificultad,
              t.id AS tema_id, t.nombre AS tema_nombre,
              o.id AS oposicion_id, o.nombre AS oposicion_nombre
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       WHERE ${where.join(' AND ')}
       ORDER BY random()
       LIMIT $${params.length}`,
      params,
    );
    return result.rows;
  },

  async listPreguntasDisponiblesOposicion({ oposicionId, cantidad, dificultad, excludeIds, excludeTemaIds, officialidad, anioIds, examenId, examenIds }) {
    const nivel = normalizeDificultad(dificultad);
    const params = [oposicionId, nivel, excludeIds ?? [], excludeTemaIds ?? []];
    const where = [
      `p.estado = 'aprobada'`, `o.id = $1`, `($2::text IS NULL OR p.nivel_dificultad = $2)`,
      `NOT (p.id = ANY($3::bigint[]))`, `NOT (t.id = ANY($4::bigint[]))`,
    ];
    appendOfficialFilters({ officialidad, anioIds, examenId, examenIds }, params, where);
    params.push(cantidad);
    const result = await pool.query(
      `SELECT p.id, p.enunciado, p.nivel_dificultad,
              t.id AS tema_id, t.nombre AS tema_nombre,
              o.id AS oposicion_id, o.nombre AS oposicion_nombre
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       WHERE ${where.join(' AND ')}
       ORDER BY random()
       LIMIT $${params.length}`,
      params,
    );
    return result.rows;
  },

  async countDisponibles({ oposicionId, temaId, dificultad, excludeIds, officialidad, anioIds, examenId, examenIds }) {
    const nivel = normalizeDificultad(dificultad);
    const params = [oposicionId, temaId, nivel, excludeIds ?? []];
    const where = [
      `p.estado = 'aprobada'`, `t.oposicion_id = $1`, `t.id = $2`,
      `($3::text IS NULL OR p.nivel_dificultad = $3)`, `NOT (p.id = ANY($4::bigint[]))`,
    ];
    appendOfficialFilters({ officialidad, anioIds, examenId, examenIds }, params, where);
    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       WHERE ${where.join(' AND ')}`,
      params,
    );
    return result.rows[0].total;
  },

  async listTemaIdsInOposicion(oposicionId, temaIds) {
    if (!temaIds?.length) return [];
    const result = await pool.query(
      `SELECT id::text AS id
       FROM temas
       WHERE oposicion_id = $1 AND id = ANY($2::bigint[])`,
      [oposicionId, temaIds],
    );
    return result.rows.map((row) => String(row.id));
  },

  async listTemasInOposicion(oposicionId, temaIds) {
    if (!temaIds?.length) return [];
    const result = await pool.query(
      `SELECT id, nombre
       FROM temas
       WHERE oposicion_id = $1 AND id = ANY($2::bigint[])`,
      [oposicionId, temaIds],
    );
    return result.rows;
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
