import pool from '../config/db.js';

export const adminProfesoresGestionRepository = {
  async listProfesores({ q }, limit, offset) {
    const args = [];
    const conditions = ["u.role = 'profesor'", 'u.deleted_at IS NULL'];

    if (q) {
      args.push(`%${q}%`);
      conditions.push(`(u.nombre ILIKE $${args.length} OR u.email ILIKE $${args.length})`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    args.push(limit, offset);

    const result = await pool.query(
      `SELECT u.id, u.nombre, u.email, u.fecha_registro,
              COUNT(po.id)::int AS oposiciones_count
       FROM usuarios u
       LEFT JOIN profesores_oposiciones po ON po.user_id = u.id
       ${where}
       GROUP BY u.id
       ORDER BY u.nombre ASC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );

    const countArgs = args.slice(0, args.length - 2);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM usuarios u ${where}`,
      countArgs,
    );

    return { rows: result.rows, total: countResult.rows[0].total };
  },

  async findByEmail(email) {
    const result = await pool.query(
      `SELECT id, nombre, email, role FROM usuarios WHERE email = $1 AND deleted_at IS NULL`,
      [email],
    );
    return result.rows[0] ?? null;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT id, nombre, email, role FROM usuarios WHERE id = $1 AND role = 'profesor' AND deleted_at IS NULL`,
      [id],
    );
    return result.rows[0] ?? null;
  },

  async createProfesor({ nombre, email, passwordHash }) {
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, role)
       VALUES ($1, $2, $3, 'profesor')
       RETURNING id, nombre, email, role, fecha_registro`,
      [nombre, email, passwordHash],
    );
    return result.rows[0];
  },

  async updateProfesor(id, fields) {
    const sets = [];
    const args = [];

    if (fields.nombre) { args.push(fields.nombre); sets.push(`nombre = $${args.length}`); }
    if (fields.email)  { args.push(fields.email);  sets.push(`email = $${args.length}`); }

    if (sets.length === 0) return null;

    args.push(id);
    const result = await pool.query(
      `UPDATE usuarios SET ${sets.join(', ')}
       WHERE id = $${args.length} AND role = 'profesor' AND deleted_at IS NULL
       RETURNING id, nombre, email, role, fecha_registro`,
      args,
    );
    return result.rows[0] ?? null;
  },

  async deleteProfesor(id) {
    const result = await pool.query(
      `UPDATE usuarios SET deleted_at = NOW()
       WHERE id = $1 AND role = 'profesor' AND deleted_at IS NULL
       RETURNING id`,
      [id],
    );
    return result.rows[0] ?? null;
  },
};
