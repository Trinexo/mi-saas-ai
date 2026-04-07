import pool from '../config/db.js';

export const adminPreguntasListadoRevisionRepository = {
  async listPreguntasSinRevisar(filters, limit, offset) {
    const args = [];
    const where = ['p.estado = \'pendiente\''];

    if (filters.oposicionId) {
      args.push(filters.oposicionId);
      where.push(`m.oposicion_id = $${args.length}`);
    }
    if (filters.materiaId) {
      args.push(filters.materiaId);
      where.push(`t.materia_id = $${args.length}`);
    }
    if (filters.temaId) {
      args.push(filters.temaId);
      where.push(`p.tema_id = $${args.length}`);
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;
    args.push(limit, offset);

    const result = await pool.query(
      `SELECT p.id, p.tema_id, p.enunciado, p.nivel_dificultad, p.estado, p.fecha_actualizacion,
              t.nombre AS tema_nombre,
              m.nombre AS materia_nombre,
              o.nombre AS oposicion_nombre
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       ${whereClause}
       ORDER BY p.fecha_actualizacion ASC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    const countArgs = args.slice(0, args.length - 2);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM preguntas p
       JOIN temas t ON t.id = p.tema_id
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       ${whereClause}`,
      countArgs,
    );

    return { rows: result.rows, total: countResult.rows[0].total };
  },

  async getPreguntasPorEstado() {
    const result = await pool.query(
      `SELECT estado, COUNT(*)::int AS total
       FROM preguntas
       GROUP BY estado
       ORDER BY estado`,
    );
    return result.rows;
  },
};
