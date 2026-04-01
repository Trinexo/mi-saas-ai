import pool from '../config/db.js';

export const adminDashboardRepository = {
  async getAdminStats() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM preguntas)                                      AS total_preguntas,
        (SELECT COUNT(*)::int FROM preguntas WHERE estado = 'pendiente')           AS pendientes_revision,
        (SELECT COUNT(*)::int FROM usuarios)                                       AS total_usuarios,
        (SELECT COUNT(*)::int FROM tests WHERE estado = 'completado')              AS total_tests,
        (SELECT COUNT(*)::int FROM tests
          WHERE estado = 'completado'
            AND created_at >= NOW() - INTERVAL '7 days')                          AS tests_esta_semana,
        (SELECT ROUND(AVG(nota_total)::numeric, 2)
          FROM tests WHERE estado = 'completado')                                  AS nota_media_global
    `);
    const row = result.rows[0];
    return {
      totalPreguntas: row.total_preguntas,
      pendientesRevision: row.pendientes_revision,
      totalUsuarios: row.total_usuarios,
      totalTests: row.total_tests,
      testsEstaSemana: row.tests_esta_semana,
      notaMediaGlobal: row.nota_media_global !== null ? Number(row.nota_media_global) : null,
    };
  },

  async listUsers({ role, q }, limit, offset) {
    const args = [];
    const where = [];

    if (role) {
      args.push(role);
      where.push(`u.role = $${args.length}`);
    }
    if (q) {
      args.push(`%${q}%`);
      where.push(`(u.nombre ILIKE $${args.length} OR u.email ILIKE $${args.length})`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    args.push(limit, offset);

    const result = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.role, u.fecha_registro
       FROM usuarios u
       ${whereClause}
       ORDER BY u.fecha_registro DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    const countArgs = args.slice(0, args.length - 2);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM usuarios u ${whereClause}`,
      countArgs,
    );

    return { rows: result.rows, total: countResult.rows[0].total };
  },

  async updateUserRole(userId, role) {
    const result = await pool.query(
      `UPDATE usuarios SET role = $2 WHERE id = $1 RETURNING id, nombre, email, role`,
      [userId, role],
    );
    return result.rows[0] ?? null;
  },

  async getTemasConMasErrores(limit) {
    const result = await pool.query(
      `SELECT
         t.id            AS tema_id,
         t.nombre        AS tema_nombre,
         m.nombre        AS materia_nombre,
         COUNT(*)::int   AS total_respuestas,
         SUM(CASE WHEN ru.correcta = false THEN 1 ELSE 0 END)::int  AS total_errores,
         ROUND(
           SUM(CASE WHEN ru.correcta = false THEN 1 ELSE 0 END)::numeric
           / NULLIF(COUNT(*), 0) * 100, 1
         ) AS pct_error
       FROM respuestas_usuario ru
       JOIN preguntas p ON p.id = ru.pregunta_id
       JOIN temas t ON t.id = p.tema_id
       JOIN materias m ON m.id = t.materia_id
       WHERE ru.correcta IS NOT NULL
       GROUP BY t.id, t.nombre, m.nombre
       HAVING COUNT(*) >= 10
       ORDER BY total_errores DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows.map((r) => ({
      temaId: r.tema_id,
      temaNombre: r.tema_nombre,
      materiaNombre: r.materia_nombre,
      totalRespuestas: r.total_respuestas,
      totalErrores: r.total_errores,
      pctError: r.pct_error !== null ? Number(r.pct_error) : null,
    }));
  },
};
