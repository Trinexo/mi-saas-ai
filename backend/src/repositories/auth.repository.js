import pool from '../config/db.js';

export const authRepository = {
  async getUserByEmail(email) {
    const result = await pool.query('SELECT id, nombre, email, password_hash, role FROM usuarios WHERE email = $1', [email]);
    return result.rows[0] ?? null;
  },

  async createUser({ nombre, email, passwordHash }) {
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, role)
       VALUES ($1, $2, $3, 'alumno')
       RETURNING id, nombre, email, role`,
      [nombre, email, passwordHash],
    );

    return result.rows[0];
  },
};