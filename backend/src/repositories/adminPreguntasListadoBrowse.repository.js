import pool from '../config/db.js';

const buildWhere = (filters, args) => {
  const where = [];

  if (filters.allowedOposicionIds && filters.allowedOposicionIds.length > 0) {
    args.push(filters.allowedOposicionIds);
    where.push(`t.oposicion_id = ANY($${args.length}::int[])`);
  }

  if (filters.oposicionId) {
    args.push(filters.oposicionId);
    where.push(`t.oposicion_id = $${args.length}`);
  }
  if (filters.temaId) {
    args.push(filters.temaId);
    where.push(`p.tema_id = $${args.length}`);
  }
  if (filters.temaIds?.length) {
    args.push(filters.temaIds);
    where.push(`p.tema_id = ANY($${args.length}::int[])`);
  }
  if (filters.coleccionId) {
    args.push(filters.coleccionId);
    where.push(`EXISTS (SELECT 1 FROM colecciones_preguntas cp WHERE cp.pregunta_id = p.id AND cp.coleccion_id = $${args.length})`);
  }
  if (filters.nivelDificultad) {
    args.push(filters.nivelDificultad);
    where.push(`p.nivel_dificultad = $${args.length}`);
  }
  if (filters.estado) {
    args.push(filters.estado);
    where.push(`p.estado = $${args.length}`);
  }
  if (filters.q) {
    args.push(`%${filters.q}%`);
    where.push(`p.enunciado ILIKE $${args.length}`);
  }
  if (filters.officialidad === 'official') where.push('EXISTS (SELECT 1 FROM preguntas_anios_oficiales pao WHERE pao.pregunta_id = p.id)');
  if (filters.officialidad === 'non_official') where.push('NOT EXISTS (SELECT 1 FROM preguntas_anios_oficiales pao WHERE pao.pregunta_id = p.id)');
  if (filters.anio != null) { args.push(filters.anio); where.push(`EXISTS (SELECT 1 FROM preguntas_anios_oficiales pao JOIN oposiciones_anios_oficiales oao ON oao.id = pao.oposicion_anio_id WHERE pao.pregunta_id = p.id AND oao.anio = $${args.length})`); }
  if (filters.anioIds?.length) { args.push(filters.anioIds); where.push(`EXISTS (SELECT 1 FROM preguntas_anios_oficiales pao WHERE pao.pregunta_id = p.id AND pao.oposicion_anio_id = ANY($${args.length}::bigint[]))`); }
  const examenIds = filters.examenIds?.length ? filters.examenIds : (filters.examenId != null ? [filters.examenId] : []);
  if (examenIds.length) { args.push(examenIds); where.push(`EXISTS (SELECT 1 FROM examenes_oficiales_preguntas eop WHERE eop.pregunta_id = p.id AND eop.examen_id = ANY($${args.length}::bigint[]))`); }

  return where.length ? `WHERE ${where.join(' AND ')}` : '';
};

export const adminPreguntasListadoBrowseRepository = {
  async listPreguntas(filters, limit, offset) {
    const args = [];
    const where = buildWhere(filters, args);
    args.push(limit, offset);

    const result = await pool.query(
      `SELECT p.id, p.tema_id, p.enunciado, p.nivel_dificultad, p.estado,
              EXISTS (SELECT 1 FROM preguntas_anios_oficiales pao WHERE pao.pregunta_id = p.id) AS es_oficial,
              t.nombre  AS tema_nombre,
              o.nombre  AS oposicion_nombre
       FROM preguntas p
       JOIN temas t       ON t.id  = p.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       ${where}
       ORDER BY p.id DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    return result.rows;
  },

  async countPreguntas(filters) {
    const args = [];
    const where = buildWhere(filters, args);

    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       ${where}`,
      args,
    );

    return result.rows[0].total;
  },

  async listUserAssignedOposiciones(userId) {
    const result = await pool.query(
      `SELECT oposicion_id FROM profesores_oposiciones WHERE user_id = $1`,
      [userId],
    );
    return result.rows.map((r) => r.oposicion_id);
  },

  async existsTemaInOposiciones(temaId, oposicionIds) {
    if (!oposicionIds || oposicionIds.length === 0) return false;
    const result = await pool.query(
      `SELECT 1 FROM temas WHERE id = $1 AND oposicion_id = ANY($2::int[]) LIMIT 1`,
      [temaId, oposicionIds],
    );
    return result.rows.length > 0;
  },
};
