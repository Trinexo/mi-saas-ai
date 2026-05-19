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
       JOIN auditoria_preguntas a ON a.pregunta_id = p.id AND a.accion = 'create'
       WHERE a.usuario_id = $1`,
      [userId],
    );
    return result.rows[0];
  },

  async getActividadReciente(userId, limit = 10) {
    const result = await pool.query(
      `SELECT p.id, p.enunciado, a.fecha AS creado_en,
              t.nombre AS tema_nombre, o.nombre AS oposicion_nombre
       FROM preguntas p
       JOIN auditoria_preguntas a ON a.pregunta_id = p.id AND a.accion = 'create'
       JOIN temas t    ON t.id  = p.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       JOIN profesores_oposiciones po ON po.oposicion_id = o.id AND po.user_id = $1
       ORDER BY a.fecha DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  },

  async getMisPreguntas(userId, { oposicionId, temaId, nivelDificultad, estado, q, page, pageSize }) {
    const args = [userId];
    const conditions = ['po.user_id = $1'];

    if (oposicionId) {
      args.push(oposicionId);
      conditions.push(`t.oposicion_id = $${args.length}`);
    }
    if (temaId) {
      args.push(temaId);
      conditions.push(`p.tema_id = $${args.length}`);
    }
    if (q) {
      args.push(`%${q}%`);
      conditions.push(`p.enunciado ILIKE $${args.length}`);
    }
    if (nivelDificultad) {
      args.push(nivelDificultad);
      conditions.push(`p.nivel_dificultad = $${args.length}`);
    }
    // p.estado no existe en la tabla preguntas — filtro eliminado

    const where = conditions.join(' AND ');
    const offset = (page - 1) * pageSize;

    args.push(pageSize, offset);

    const result = await pool.query(
      `SELECT p.id, p.tema_id, p.enunciado, p.nivel_dificultad, a.fecha AS creado_en,
              t.nombre AS tema_nombre, o.nombre AS oposicion_nombre,
              COALESCE(ru_s.intentos, 0) AS intentos,
              COALESCE(ru_s.aciertos, 0) AS aciertos,
              COALESCE(rp_s.reportes, 0) AS reportes
       FROM preguntas p
       LEFT JOIN auditoria_preguntas a ON a.pregunta_id = p.id AND a.accion = 'create'
       JOIN temas t    ON t.id  = p.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       JOIN profesores_oposiciones po ON po.oposicion_id = o.id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS intentos,
                COUNT(*) FILTER (WHERE correcta = true)::int AS aciertos
         FROM respuestas_usuario
         WHERE pregunta_id = p.id
       ) ru_s ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS reportes
         FROM reportes_preguntas
         WHERE pregunta_id = p.id AND estado IN ('abierto', 'en_revision')
       ) rp_s ON true
       WHERE ${where}
       ORDER BY a.fecha DESC NULLS LAST, p.id DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    const countArgs = args.slice(0, args.length - 2);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM preguntas p
       JOIN temas t    ON t.id  = p.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       JOIN profesores_oposiciones po ON po.oposicion_id = o.id
       WHERE ${where}`,
      countArgs,
    );

    return { rows: result.rows, total: countResult.rows[0].total };
  },
};
