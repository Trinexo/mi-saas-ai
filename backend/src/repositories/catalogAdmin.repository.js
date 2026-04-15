import pool from '../config/db.js';

export const catalogAdminRepository = {
  // --- OPOSICIONES ---
  async createOposicion(nombre, descripcion) {
    const r = await pool.query(
      'INSERT INTO oposiciones (nombre, descripcion) VALUES ($1, $2) RETURNING id, nombre, descripcion',
      [nombre, descripcion ?? null],
    );
    return r.rows[0];
  },

  async updateOposicion(id, fields) {
    const setClauses = [];
    const values = [];
    if (fields.nombre !== undefined) { values.push(fields.nombre); setClauses.push(`nombre = $${values.length}`); }
    if (fields.descripcion !== undefined) { values.push(fields.descripcion); setClauses.push(`descripcion = $${values.length}`); }
    if (fields.tiempo_limite_minutos !== undefined) { values.push(fields.tiempo_limite_minutos); setClauses.push(`tiempo_limite_minutos = $${values.length}`); }
    values.push(id);
    const r = await pool.query(
      `UPDATE oposiciones SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING id, nombre, descripcion, tiempo_limite_minutos`,
      values,
    );
    return r.rows[0] ?? null;
  },

  async deleteOposicion(id) {
    const r = await pool.query('DELETE FROM oposiciones WHERE id = $1 RETURNING id', [id]);
    return r.rows[0] ?? null;
  },

  // --- MATERIAS ---
  async createMateria(oposicionId, nombre) {
    const r = await pool.query(
      'INSERT INTO materias (oposicion_id, nombre) VALUES ($1, $2) RETURNING id, oposicion_id, nombre',
      [oposicionId, nombre],
    );
    return r.rows[0];
  },

  async updateMateria(id, nombre) {
    const r = await pool.query(
      'UPDATE materias SET nombre = $1 WHERE id = $2 RETURNING id, oposicion_id, nombre',
      [nombre, id],
    );
    return r.rows[0] ?? null;
  },

  async deleteMateria(id) {
    const r = await pool.query('DELETE FROM materias WHERE id = $1 RETURNING id', [id]);
    return r.rows[0] ?? null;
  },

  // --- TEMAS ---
  async createTema(materiaId, nombre) {
    const r = await pool.query(
      'INSERT INTO temas (materia_id, nombre) VALUES ($1, $2) RETURNING id, materia_id, nombre',
      [materiaId, nombre],
    );
    return r.rows[0];
  },

  async updateTema(id, nombre) {
    const r = await pool.query(
      'UPDATE temas SET nombre = $1 WHERE id = $2 RETURNING id, materia_id, nombre',
      [nombre, id],
    );
    return r.rows[0] ?? null;
  },

  async deleteTema(id) {
    const r = await pool.query('DELETE FROM temas WHERE id = $1 RETURNING id', [id]);
    return r.rows[0] ?? null;
  },
};
