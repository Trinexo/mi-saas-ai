import pool from '../config/db.js';

export const adminDashboardUsersRepository = {
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
};
