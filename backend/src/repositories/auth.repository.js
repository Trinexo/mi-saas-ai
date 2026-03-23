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

  async getUserById(id) {
    const result = await pool.query(
      'SELECT id, nombre, email, role, oposicion_preferida_id, objetivo_diario_preguntas, fecha_registro FROM usuarios WHERE id = $1',
      [id],
    );
    return result.rows[0] ?? null;
  },

  async updateProfile(id, fields) {
    const sets = [];
    const values = [];
    let idx = 1;
    if (fields.nombre !== undefined) { sets.push(`nombre = $${idx++}`); values.push(fields.nombre); }
    if (fields.email !== undefined) { sets.push(`email = $${idx++}`); values.push(fields.email); }
    if (fields.oposicionPreferidaId !== undefined) { sets.push(`oposicion_preferida_id = $${idx++}`); values.push(fields.oposicionPreferidaId); }
    if (fields.objetivoDiarioPreguntas !== undefined) { sets.push(`objetivo_diario_preguntas = $${idx++}`); values.push(fields.objetivoDiarioPreguntas); }
    values.push(id);
    const result = await pool.query(
      `UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, nombre, email, role, oposicion_preferida_id, objetivo_diario_preguntas`,
      values,
    );
    return result.rows[0] ?? null;
  },

  async getPasswordHash(id) {
    const result = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [id]);
    return result.rows[0]?.password_hash ?? null;
  },

  async updatePasswordHash(id, passwordHash) {
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  },
};