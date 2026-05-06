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
    where.push(`bl.tema_id = $${args.length}`);
  }
  if (filters.bloqueId) {
    args.push(filters.bloqueId);
    where.push(`p.bloque_id = $${args.length}`);
  }
  if (filters.nivelDificultad) {
    args.push(filters.nivelDificultad);
    where.push(`p.nivel_dificultad = $${args.length}`);
  }

  return where.length ? `WHERE ${where.join(' AND ')}` : '';
};

export const adminPreguntasListadoBrowseRepository = {
  async listPreguntas(filters, limit, offset) {
    const args = [];
    const where = buildWhere(filters, args);
    args.push(limit, offset);

    const result = await pool.query(
      `SELECT p.id, p.bloque_id, p.enunciado, p.nivel_dificultad,
              bl.nombre AS bloque_nombre,
              t.nombre  AS tema_nombre,
              o.nombre  AS oposicion_nombre
       FROM preguntas p
       JOIN bloques bl ON bl.id = p.bloque_id
       JOIN temas t    ON t.id  = bl.tema_id
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
       JOIN bloques bl ON bl.id = p.bloque_id
       JOIN temas t    ON t.id  = bl.tema_id
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

  async existsBloqueInOposiciones(bloqueId, oposicionIds) {
    if (!oposicionIds || oposicionIds.length === 0) return false;
    const result = await pool.query(
      `SELECT 1
       FROM bloques bl
       JOIN temas t ON t.id = bl.tema_id
       WHERE bl.id = $1
         AND t.oposicion_id = ANY($2::int[])
       LIMIT 1`,
      [bloqueId, oposicionIds],
    );
    return result.rows.length > 0;
  },
};
