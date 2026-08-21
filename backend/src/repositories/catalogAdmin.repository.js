import pool from '../config/db.js';

export const catalogAdminRepository = {
  // --- OPOSICIONES ---
  async createOposicion(nombre, descripcion, slug, modelosDisponibles = ['experto', 'guiado']) {
    const r = await pool.query(
       `INSERT INTO oposiciones (nombre, descripcion, slug, modelos_disponibles)
        VALUES ($1, $2, $3, $4)
        RETURNING id, nombre, descripcion, slug, modelos_disponibles`,
      [nombre, descripcion ?? null, slug, modelosDisponibles],
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
         COUNT(DISTINCT ao.usuario_id)::int     AS total_usuarios,
         o.modelos_disponibles
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
    if (fields.modelos_disponibles !== undefined) {
      const accesosIncompatibles = await this.listIncompatibleAccesses(id, fields.modelos_disponibles);
      if (accesosIncompatibles.length > 0) {
        const current = await pool.query(
          'SELECT modelos_disponibles FROM oposiciones WHERE id = $1',
          [id],
        );
        const error = new Error('La oposición dejaría accesos incompatibles');
        error.code = 'OPPOSITION_MODES_INCOMPATIBLE';
        error.details = {
          oposicionId: String(id),
          modelosActuales: current.rows[0]?.modelos_disponibles ?? [],
          modelosSolicitados: fields.modelos_disponibles,
          accesosIncompatibles,
        };
        throw error;
      }
    }
    const setClauses = [];
    const values = [];
    if (fields.nombre !== undefined)               { values.push(fields.nombre);               setClauses.push(`nombre = $${values.length}`); }
    if (fields.descripcion !== undefined)          { values.push(fields.descripcion);          setClauses.push(`descripcion = $${values.length}`); }
    if (fields.tiempo_limite_minutos !== undefined){ values.push(fields.tiempo_limite_minutos); setClauses.push(`tiempo_limite_minutos = $${values.length}`); }
    if (fields.categoria !== undefined)            { values.push(fields.categoria);            setClauses.push(`categoria = $${values.length}`); }
    if (fields.estado !== undefined)               { values.push(fields.estado);               setClauses.push(`estado = $${values.length}`); }
    let compatibilityClause = '';
    if (fields.modelos_disponibles !== undefined) {
      values.push(fields.modelos_disponibles);
      const modesParam = `$${values.length}`;
      setClauses.push(`modelos_disponibles = ${modesParam}`);
      compatibilityClause = `
        AND NOT EXISTS (
          SELECT 1 FROM accesos_oposicion ao
           WHERE ao.oposicion_id = oposiciones.id
             AND (
               (ao.modo_activo IS NOT NULL AND NOT (ao.modo_activo = ANY(${modesParam}::TEXT[])))
               OR NOT EXISTS (
                 SELECT 1 FROM acceso_oposicion_modelos aom
                  WHERE aom.acceso_id = ao.id AND aom.modelo = ANY(${modesParam}::TEXT[])
               )
             )
        )`;
    }
    if (setClauses.length === 0) return null;
    values.push(id);
    const r = await pool.query(
       `UPDATE oposiciones SET ${setClauses.join(', ')} WHERE id = $${values.length}${compatibilityClause}
       RETURNING id, nombre, descripcion, categoria, estado, tiempo_limite_minutos, modelos_disponibles`,
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

  async hasIncompatibleAccesses(oposicionId, modelos) {
    return (await this.listIncompatibleAccesses(oposicionId, modelos)).length > 0;
  },

  async listIncompatibleAccesses(oposicionId, modelos) {
    const r = await pool.query(
      `WITH acceso_modelos AS (
         SELECT ao.id,
                ao.usuario_id,
                ao.estado,
                ao.modo_activo,
                u.nombre AS usuario_nombre,
                u.email AS usuario_email,
                COALESCE(
                  array_agg(DISTINCT aom.modelo ORDER BY aom.modelo)
                    FILTER (WHERE aom.modelo IS NOT NULL),
                  ARRAY[]::text[]
                ) AS modelos_acceso
           FROM accesos_oposicion ao
           JOIN usuarios u ON u.id = ao.usuario_id
           LEFT JOIN acceso_oposicion_modelos aom ON aom.acceso_id = ao.id
          WHERE ao.oposicion_id = $1
          GROUP BY ao.id, ao.usuario_id, ao.estado, ao.modo_activo, u.nombre, u.email
       ), efectivos AS (
         SELECT am.*,
                ARRAY(
                  SELECT modelo
                    FROM unnest(am.modelos_acceso) AS modelo
                   WHERE modelo = ANY($2::text[])
                ) AS modelos_efectivos_resultantes
           FROM acceso_modelos am
       )
       SELECT id::text AS acceso_id,
              usuario_id::text AS usuario_id,
              usuario_nombre,
              usuario_email,
              estado,
              modelos_acceso AS modelos_disponibles,
              modo_activo,
              modelos_efectivos_resultantes,
              CASE
                WHEN cardinality(modelos_efectivos_resultantes) = 0
                  THEN 'sin_modelo_compatible'
                ELSE 'modo_activo_incompatible'
              END AS motivo_codigo,
              CASE
                WHEN cardinality(modelos_efectivos_resultantes) = 0
                  THEN 'El alumno no tiene autorizado ningún modo permitido por la oposición.'
                ELSE 'El modo activo del alumno es ' ||
                  CASE modo_activo
                    WHEN 'experto' THEN 'Experto'
                    WHEN 'guiado' THEN 'Guiado'
                    ELSE modo_activo
                  END || ' y dejaría de estar disponible.'
              END AS motivo
         FROM efectivos
        WHERE cardinality(modelos_efectivos_resultantes) = 0
           OR (modo_activo IS NOT NULL
               AND NOT (modo_activo = ANY(modelos_efectivos_resultantes)))
        ORDER BY usuario_nombre, usuario_email, id`,
      [oposicionId, modelos],
    );
    return r.rows;
  },

  async getTemaDeleteDependencies(id) {
    const r = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM preguntas WHERE tema_id = $1) AS preguntas,
         (SELECT COUNT(*)::int FROM colecciones WHERE tema_id = $1) AS colecciones,
         (SELECT COUNT(*)::int FROM admin_tests WHERE tema_id = $1) AS admin_tests,
         (SELECT COUNT(*)::int FROM admin_tests_temas WHERE tema_id = $1) AS admin_tests_temas,
         (SELECT COUNT(*)::int FROM albacer_modulo_temas WHERE tema_id = $1) AS albacer_modulo_temas,
         (SELECT COUNT(*)::int FROM planificacion_academica_temas WHERE tema_id = $1) AS planificacion_academica_temas,
         (SELECT COUNT(*)::int FROM progreso_usuario WHERE tema_id = $1) AS progreso_usuario,
         (SELECT COUNT(*)::int FROM simulacros_configuracion_temas WHERE tema_id = $1) AS simulacros_configuracion_temas,
         (SELECT COUNT(*)::int FROM tests WHERE tema_id = $1) AS tests`,
      [id],
    );
    return r.rows[0] ?? {
      preguntas: 0,
      colecciones: 0,
      admin_tests: 0,
      admin_tests_temas: 0,
      albacer_modulo_temas: 0,
      planificacion_academica_temas: 0,
      progreso_usuario: 0,
      simulacros_configuracion_temas: 0,
      tests: 0,
    };
  },

  async deleteTema(id) {
    const r = await pool.query(
      `DELETE FROM temas
       WHERE id = $1
         AND NOT EXISTS (SELECT 1 FROM preguntas WHERE tema_id = $1)
         AND NOT EXISTS (SELECT 1 FROM colecciones WHERE tema_id = $1)
         AND NOT EXISTS (SELECT 1 FROM admin_tests WHERE tema_id = $1)
         AND NOT EXISTS (SELECT 1 FROM admin_tests_temas WHERE tema_id = $1)
         AND NOT EXISTS (SELECT 1 FROM albacer_modulo_temas WHERE tema_id = $1)
         AND NOT EXISTS (SELECT 1 FROM planificacion_academica_temas WHERE tema_id = $1)
         AND NOT EXISTS (SELECT 1 FROM progreso_usuario WHERE tema_id = $1)
         AND NOT EXISTS (SELECT 1 FROM simulacros_configuracion_temas WHERE tema_id = $1)
         AND NOT EXISTS (SELECT 1 FROM tests WHERE tema_id = $1)
       RETURNING id`,
      [id],
    );
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
