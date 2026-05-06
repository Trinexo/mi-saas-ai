import pool from '../config/db.js';

export const adminEtiquetasRepository = {
  // ─── Listado ─────────────────────────────────────────────────────────────────
  async listEtiquetas({ q, limit, offset }) {
    const rows = await pool.query(
      `SELECT
         e.id, e.nombre, e.color, e.descripcion, e.fecha_creacion,
         COUNT(pe.pregunta_id)::int AS total_preguntas
       FROM etiquetas e
       LEFT JOIN preguntas_etiquetas pe ON pe.etiqueta_id = e.id
       WHERE ($1::text IS NULL OR e.nombre ILIKE $1)
       GROUP BY e.id
       ORDER BY e.nombre
       LIMIT $2 OFFSET $3`,
      [q ? `%${q}%` : null, limit, offset],
    );
    const countRow = await pool.query(
      `SELECT COUNT(*)::int AS total FROM etiquetas
       WHERE ($1::text IS NULL OR nombre ILIKE $1)`,
      [q ? `%${q}%` : null],
    );
    return { items: rows.rows, total: countRow.rows[0].total };
  },

  // ─── Detalle con preguntas asociadas ─────────────────────────────────────────
  async getEtiqueta(id) {
    const r = await pool.query(
      `SELECT e.id, e.nombre, e.color, e.descripcion, e.fecha_creacion,
              COUNT(pe.pregunta_id)::int AS total_preguntas
       FROM etiquetas e
       LEFT JOIN preguntas_etiquetas pe ON pe.etiqueta_id = e.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [id],
    );
    return r.rows[0] ?? null;
  },

  // ─── Crear ────────────────────────────────────────────────────────────────────
  async createEtiqueta(nombre, color, descripcion, creadoPor) {
    const r = await pool.query(
      `INSERT INTO etiquetas (nombre, color, descripcion, creado_por)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, color, descripcion, fecha_creacion`,
      [nombre, color ?? null, descripcion ?? null, creadoPor],
    );
    return r.rows[0];
  },

  // ─── Actualizar ───────────────────────────────────────────────────────────────
  async updateEtiqueta(id, fields) {
    const setClauses = [];
    const values = [];
    if (fields.nombre      !== undefined) { values.push(fields.nombre);      setClauses.push(`nombre = $${values.length}`); }
    if (fields.color       !== undefined) { values.push(fields.color);       setClauses.push(`color = $${values.length}`); }
    if (fields.descripcion !== undefined) { values.push(fields.descripcion); setClauses.push(`descripcion = $${values.length}`); }
    if (setClauses.length === 0) return null;
    values.push(id);
    const r = await pool.query(
      `UPDATE etiquetas SET ${setClauses.join(', ')} WHERE id = $${values.length}
       RETURNING id, nombre, color, descripcion, fecha_creacion`,
      values,
    );
    return r.rows[0] ?? null;
  },

  // ─── Eliminar ─────────────────────────────────────────────────────────────────
  async deleteEtiqueta(id) {
    const r = await pool.query(
      'DELETE FROM etiquetas WHERE id = $1 RETURNING id',
      [id],
    );
    return r.rows[0] ?? null;
  },

  // ─── Asociar etiquetas a una pregunta (reemplaza las existentes) ──────────────
  async setEtiquetasDePregunta(preguntaId, etiquetaIds) {
    await pool.query(
      'DELETE FROM preguntas_etiquetas WHERE pregunta_id = $1',
      [preguntaId],
    );
    if (etiquetaIds.length === 0) return [];
    const placeholders = etiquetaIds.map((_, i) => `($1, $${i + 2})`).join(', ');
    const r = await pool.query(
      `INSERT INTO preguntas_etiquetas (pregunta_id, etiqueta_id)
       VALUES ${placeholders}
       ON CONFLICT DO NOTHING
       RETURNING etiqueta_id`,
      [preguntaId, ...etiquetaIds],
    );
    return r.rows.map((row) => row.etiqueta_id);
  },

  // ─── Etiquetas de una pregunta ────────────────────────────────────────────────
  async getEtiquetasDePregunta(preguntaId) {
    const r = await pool.query(
      `SELECT e.id, e.nombre, e.color
       FROM etiquetas e
       JOIN preguntas_etiquetas pe ON pe.etiqueta_id = e.id
       WHERE pe.pregunta_id = $1
       ORDER BY e.nombre`,
      [preguntaId],
    );
    return r.rows;
  },
};
