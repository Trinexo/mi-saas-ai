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

  async syncOposicionIdSequence() {
    await pool.query(
      `SELECT setval(
         pg_get_serial_sequence('public.oposiciones', 'id'),
         GREATEST((SELECT COALESCE(MAX(id), 0) FROM public.oposiciones), 1),
         (SELECT COALESCE(MAX(id), 0) FROM public.oposiciones) > 0
       )`,
    );
  },

  async listOposicionesConStats({ q, estado, categoria, limit, offset }) {
    const params = [
      q ? `%${q}%` : null,
      estado ?? null,
      categoria ?? null,
      limit,
      offset,
    ];
    const rows = await pool.query(
      `SELECT
         o.id, o.nombre, o.descripcion, o.categoria, o.estado,
         COUNT(DISTINCT p.id)::int              AS total_preguntas,
         COUNT(DISTINCT t.id)::int              AS total_tests,
         COUNT(DISTINCT ao.usuario_id)::int     AS total_usuarios
       FROM oposiciones o
       LEFT JOIN temas    te ON te.oposicion_id = o.id
       LEFT JOIN preguntas p ON p.tema_id       = te.id
       LEFT JOIN tests     t ON t.oposicion_id = o.id
       LEFT JOIN accesos_oposicion ao ON ao.oposicion_id = o.id AND ao.estado = 'activo'
       WHERE ($1::text IS NULL OR o.nombre ILIKE $1)
         AND ($2::text IS NULL OR o.estado    = $2)
         AND ($3::text IS NULL OR o.categoria = $3)
       GROUP BY o.id
       ORDER BY o.nombre
       LIMIT $4 OFFSET $5`,
      params,
    );
    const countRow = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM oposiciones o
       WHERE ($1::text IS NULL OR o.nombre ILIKE $1)
         AND ($2::text IS NULL OR o.estado    = $2)
         AND ($3::text IS NULL OR o.categoria = $3)`,
      [q ? `%${q}%` : null, estado ?? null, categoria ?? null],
    );
    return { items: rows.rows, total: countRow.rows[0].total };
  },

  async updateOposicion(id, fields) {
    const setClauses = [];
    const values = [];
    if (fields.nombre !== undefined)               { values.push(fields.nombre);               setClauses.push(`nombre = $${values.length}`); }
    if (fields.descripcion !== undefined)          { values.push(fields.descripcion);          setClauses.push(`descripcion = $${values.length}`); }
    if (fields.tiempo_limite_minutos !== undefined){ values.push(fields.tiempo_limite_minutos); setClauses.push(`tiempo_limite_minutos = $${values.length}`); }
    if (fields.categoria !== undefined)            { values.push(fields.categoria);            setClauses.push(`categoria = $${values.length}`); }
    if (fields.estado !== undefined)               { values.push(fields.estado);               setClauses.push(`estado = $${values.length}`); }
    if (setClauses.length === 0) return null;
    values.push(id);
    const r = await pool.query(
      `UPDATE oposiciones SET ${setClauses.join(', ')} WHERE id = $${values.length}
       RETURNING id, nombre, descripcion, categoria, estado, tiempo_limite_minutos`,
      values,
    );
    return r.rows[0] ?? null;
  },

  async deleteOposicion(id) {
    const r = await pool.query('DELETE FROM oposiciones WHERE id = $1 RETURNING id', [id]);
    return r.rows[0] ?? null;
  },

  // --- TEMAS ---
  async createTema(oposicionId, nombre) {
    const r = await pool.query(
      'INSERT INTO temas (oposicion_id, nombre) VALUES ($1, $2) RETURNING id, oposicion_id, nombre',
      [oposicionId, nombre],
    );
    return r.rows[0];
  },

  async syncTemaIdSequence() {
    await pool.query(
      `SELECT setval(
         pg_get_serial_sequence('public.temas', 'id'),
         GREATEST((SELECT COALESCE(MAX(id), 0) FROM public.temas), 1),
         (SELECT COALESCE(MAX(id), 0) FROM public.temas) > 0
       )`,
    );
  },

  async updateTema(id, nombre) {
    const r = await pool.query(
      'UPDATE temas SET nombre = $1 WHERE id = $2 RETURNING id, oposicion_id, nombre',
      [nombre, id],
    );
    return r.rows[0] ?? null;
  },

  async deleteTema(id) {
    const r = await pool.query('DELETE FROM temas WHERE id = $1 RETURNING id', [id]);
    return r.rows[0] ?? null;
  },

  // --- COLECCIONES (antes: bloques) ---
  async createColeccion(temaId, nombre, opciones = {}) {
    const r = await pool.query(
      `INSERT INTO colecciones (tema_id, nombre, descripcion, creado_por, publica)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tema_id, nombre, descripcion, creado_por, publica`,
      [temaId, nombre, opciones.descripcion ?? null, opciones.creadoPor ?? null, opciones.publica ?? true],
    );
    return r.rows[0];
  },

  // Alias para compatibilidad
  async createBloque(temaId, nombre) {
    return this.createColeccion(temaId, nombre);
  },

  async updateColeccion(id, nombre, opciones = {}) {
    const setClauses = ['nombre = $1'];
    const values = [nombre];
    if (opciones.descripcion !== undefined) { values.push(opciones.descripcion); setClauses.push(`descripcion = $${values.length}`); }
    if (opciones.publica !== undefined)     { values.push(opciones.publica);     setClauses.push(`publica = $${values.length}`); }
    values.push(id);
    const r = await pool.query(
      `UPDATE colecciones SET ${setClauses.join(', ')} WHERE id = $${values.length}
       RETURNING id, tema_id, nombre, descripcion, publica`,
      values,
    );
    return r.rows[0] ?? null;
  },

  async updateBloque(id, nombre) {
    return this.updateColeccion(id, nombre);
  },

  async deleteColeccion(id) {
    const r = await pool.query('DELETE FROM colecciones WHERE id = $1 RETURNING id', [id]);
    return r.rows[0] ?? null;
  },

  async deleteBloque(id) {
    return this.deleteColeccion(id);
  },

  async listColecciones(temaId) {
    const r = await pool.query(
      `SELECT c.id, c.nombre, c.descripcion, c.publica,
              COUNT(cp.pregunta_id)::int AS total_preguntas
       FROM colecciones c
       LEFT JOIN colecciones_preguntas cp ON cp.coleccion_id = c.id
       WHERE c.tema_id = $1
       GROUP BY c.id
       ORDER BY c.nombre`,
      [temaId],
    );
    return r.rows;
  },
};
