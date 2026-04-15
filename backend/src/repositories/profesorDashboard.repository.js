import pool from '../config/db.js';

export const profesorDashboardRepository = {
  async getOposicionesAsignadas(userId) {
    const result = await pool.query(
      `SELECT o.id, o.nombre, po.creado_en AS asignado_en
       FROM profesores_oposiciones po
       JOIN oposiciones o ON o.id = po.oposicion_id
       WHERE po.user_id = $1
       ORDER BY o.nombre ASC`,
      [userId],
    );
    return result.rows;
  },

  async getStats(userId) {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total
       FROM preguntas p
       JOIN auditoria a ON a.pregunta_id = p.id AND a.accion = 'create'
       WHERE a.usuario_id = $1`,
      [userId],
    );
    return result.rows[0];
  },

  async getActividadReciente(userId, limit = 10) {
    const result = await pool.query(
      `SELECT p.id, p.enunciado, a.fecha AS creado_en,
              t.nombre AS tema_nombre, m.nombre AS materia_nombre, o.nombre AS oposicion_nombre
       FROM preguntas p
       JOIN auditoria a ON a.pregunta_id = p.id AND a.accion = 'create'
       JOIN temas t ON t.id = p.tema_id
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       WHERE a.usuario_id = $1
       ORDER BY a.fecha DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  },

  async getMisPreguntas(userId, { oposicionId, q, page, pageSize }) {
    const args = [userId];
    const conditions = ['a.usuario_id = $1', "a.accion = 'create'"];

    if (oposicionId) {
      args.push(oposicionId);
      conditions.push(`m.oposicion_id = $${args.length}`);
    }
    if (q) {
      args.push(`%${q}%`);
      conditions.push(`p.enunciado ILIKE $${args.length}`);
    }

    const where = conditions.join(' AND ');
    const offset = (page - 1) * pageSize;

    args.push(pageSize, offset);

    const result = await pool.query(
      `SELECT p.id, p.enunciado, p.nivel_dificultad, a.fecha AS creado_en,
              t.nombre AS tema_nombre, m.nombre AS materia_nombre, o.nombre AS oposicion_nombre
       FROM preguntas p
       JOIN auditoria a ON a.pregunta_id = p.id AND a.accion = 'create'
       JOIN temas t ON t.id = p.tema_id
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       WHERE ${where}
       ORDER BY a.fecha DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    const countArgs = args.slice(0, args.length - 2);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM preguntas p
       JOIN auditoria a ON a.pregunta_id = p.id AND a.accion = 'create'
       JOIN temas t ON t.id = p.tema_id
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       WHERE ${where}`,
      countArgs,
    );

    return { rows: result.rows, total: countResult.rows[0].total };
  },
};
