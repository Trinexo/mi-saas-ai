import pool from '../config/db.js';

const mapModuloRow = (row) => ({
  ...row,
  id: Number(row.id),
  oposicion_id: Number(row.oposicion_id),
  orden: Number(row.orden ?? 0),
  total_tests: Number(row.total_tests ?? 0),
  total_simulacros_finales: Number(row.total_simulacros_finales ?? 0),
  alumnos_iniciados: Number(row.alumnos_iniciados ?? 0),
  alumnos_superados: Number(row.alumnos_superados ?? 0),
  temas: Array.isArray(row.temas) ? row.temas : [],
  tema_ids: Array.isArray(row.tema_ids) ? row.tema_ids.map(Number) : [],
});

export const albacerModulosRepository = {
  async list({ q, estado, oposicionId, allowedOposicionIds, limit, offset }) {
    const params = [
      q ? `%${q}%` : null,
      estado ?? null,
      oposicionId ?? null,
      allowedOposicionIds ?? null,
      limit,
      offset,
    ];

    const rows = await pool.query(
      `SELECT
         m.*,
         o.nombre AS oposicion_nombre,
         COALESCE(t.temas, '[]'::json) AS temas,
         COALESCE(t.tema_ids, ARRAY[]::bigint[]) AS tema_ids,
         COALESCE(i.total_tests, 0)::int AS total_tests,
         COALESCE(i.total_simulacros_finales, 0)::int AS total_simulacros_finales,
         COALESCE(p.alumnos_iniciados, 0)::int AS alumnos_iniciados,
         COALESCE(p.alumnos_superados, 0)::int AS alumnos_superados
       FROM albacer_modulos m
       JOIN oposiciones o ON o.id = m.oposicion_id
       LEFT JOIN LATERAL (
         SELECT
           json_agg(json_build_object('id', te.id, 'nombre', te.nombre) ORDER BY te.nombre, te.id) AS temas,
           array_agg(te.id ORDER BY te.nombre, te.id) AS tema_ids
         FROM albacer_modulo_temas mt
         JOIN temas te ON te.id = mt.tema_id
         WHERE mt.modulo_id = m.id
       ) t ON TRUE
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) FILTER (WHERE tipo = 'test') AS total_tests,
           COUNT(*) FILTER (WHERE tipo = 'simulacro_final') AS total_simulacros_finales
         FROM albacer_modulo_items mi
         WHERE mi.modulo_id = m.id
       ) i ON TRUE
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) AS alumnos_iniciados,
           COUNT(*) FILTER (WHERE estado = 'superado') AS alumnos_superados
         FROM albacer_modulo_progreso mp
         WHERE mp.modulo_id = m.id
       ) p ON TRUE
       WHERE ($1::text IS NULL OR m.nombre ILIKE $1)
         AND ($2::text IS NULL OR m.estado = $2)
         AND ($3::bigint IS NULL OR m.oposicion_id = $3)
         AND ($4::bigint[] IS NULL OR m.oposicion_id = ANY($4::bigint[]))
       ORDER BY m.oposicion_id, m.orden, m.id
       LIMIT $5 OFFSET $6`,
      params,
    );

    const count = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM albacer_modulos m
       WHERE ($1::text IS NULL OR m.nombre ILIKE $1)
         AND ($2::text IS NULL OR m.estado = $2)
         AND ($3::bigint IS NULL OR m.oposicion_id = $3)
         AND ($4::bigint[] IS NULL OR m.oposicion_id = ANY($4::bigint[]))`,
      [params[0], params[1], params[2], params[3]],
    );

    return { items: rows.rows.map(mapModuloRow), total: Number(count.rows[0]?.total ?? 0) };
  },

  async get(id) {
    const result = await pool.query(
      `SELECT
         m.*,
         o.nombre AS oposicion_nombre,
         COALESCE(t.temas, '[]'::json) AS temas,
         COALESCE(t.tema_ids, ARRAY[]::bigint[]) AS tema_ids,
         COALESCE(i.total_tests, 0)::int AS total_tests,
         COALESCE(i.total_simulacros_finales, 0)::int AS total_simulacros_finales,
         COALESCE(p.alumnos_iniciados, 0)::int AS alumnos_iniciados,
         COALESCE(p.alumnos_superados, 0)::int AS alumnos_superados
       FROM albacer_modulos m
       JOIN oposiciones o ON o.id = m.oposicion_id
       LEFT JOIN LATERAL (
         SELECT
           json_agg(json_build_object('id', te.id, 'nombre', te.nombre) ORDER BY te.nombre, te.id) AS temas,
           array_agg(te.id ORDER BY te.nombre, te.id) AS tema_ids
         FROM albacer_modulo_temas mt
         JOIN temas te ON te.id = mt.tema_id
         WHERE mt.modulo_id = m.id
       ) t ON TRUE
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) FILTER (WHERE tipo = 'test') AS total_tests,
           COUNT(*) FILTER (WHERE tipo = 'simulacro_final') AS total_simulacros_finales
         FROM albacer_modulo_items mi
         WHERE mi.modulo_id = m.id
       ) i ON TRUE
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*) AS alumnos_iniciados,
           COUNT(*) FILTER (WHERE estado = 'superado') AS alumnos_superados
         FROM albacer_modulo_progreso mp
         WHERE mp.modulo_id = m.id
       ) p ON TRUE
       WHERE m.id = $1
       LIMIT 1`,
      [id],
    );
    return result.rows[0] ? mapModuloRow(result.rows[0]) : null;
  },

  async create(payload, caller) {
    const result = await pool.query(
      `INSERT INTO albacer_modulos
         (oposicion_id, nombre, descripcion, orden, estado, creado_por, creado_por_rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        payload.oposicion_id,
        payload.nombre,
        payload.descripcion ?? null,
        payload.orden ?? 0,
        payload.estado ?? 'borrador',
        caller.userId ?? null,
        caller.role ?? 'profesor',
      ],
    );
    return result.rows[0];
  },

  async update(id, payload) {
    const current = await this.get(id);
    if (!current) return null;

    const result = await pool.query(
      `UPDATE albacer_modulos
       SET oposicion_id = $2,
           nombre = $3,
           descripcion = $4,
           orden = $5,
           estado = $6,
           actualizado_en = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        payload.oposicion_id ?? current.oposicion_id,
        payload.nombre ?? current.nombre,
        Object.prototype.hasOwnProperty.call(payload, 'descripcion')
          ? payload.descripcion
          : current.descripcion,
        payload.orden ?? current.orden,
        payload.estado ?? current.estado,
      ],
    );
    return result.rows[0] ?? null;
  },

  async delete(id) {
    const result = await pool.query(
      'DELETE FROM albacer_modulos WHERE id = $1 RETURNING id',
      [id],
    );
    return result.rowCount > 0;
  },

  async replaceTemas(moduloId, temaIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM albacer_modulo_temas WHERE modulo_id = $1', [moduloId]);
      if (temaIds.length > 0) {
        await client.query(
          `INSERT INTO albacer_modulo_temas (modulo_id, tema_id)
           SELECT $1, unnest($2::bigint[])
           ON CONFLICT (modulo_id, tema_id) DO NOTHING`,
          [moduloId, temaIds],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async countTemasInOposicion(oposicionId, temaIds) {
    if (!temaIds.length) return 0;
    const result = await pool.query(
      `SELECT COUNT(DISTINCT id)::int AS total
       FROM temas
       WHERE oposicion_id = $1
         AND id = ANY($2::bigint[])`,
      [oposicionId, temaIds],
    );
    return Number(result.rows[0]?.total ?? 0);
  },

  async listItems(moduloId) {
    const result = await pool.query(
      `SELECT
         mi.*,
         at.nombre AS test_nombre,
         at.estado AS test_estado,
         COALESCE(test_q.total_preguntas, 0)::int AS test_total_preguntas,
         s.nombre AS simulacro_nombre,
         s.estado AS simulacro_estado,
         COALESCE(sim_q.total_preguntas, 0)::int AS simulacro_total_preguntas
       FROM albacer_modulo_items mi
       LEFT JOIN admin_tests at ON at.id = mi.plantilla_test_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS total_preguntas
         FROM admin_tests_preguntas atp
         WHERE atp.test_id = at.id
       ) test_q ON TRUE
       LEFT JOIN simulacros s ON s.id = mi.simulacro_id
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(sb.numero_preguntas), 0)::int AS total_preguntas
         FROM simulacros_bloques sb
         WHERE sb.simulacro_id = s.id
       ) sim_q ON TRUE
       WHERE mi.modulo_id = $1
       ORDER BY mi.orden, mi.id`,
      [moduloId],
    );
    return result.rows.map((row) => ({
      ...row,
      id: Number(row.id),
      modulo_id: Number(row.modulo_id),
      plantilla_test_id: row.plantilla_test_id == null ? null : Number(row.plantilla_test_id),
      simulacro_id: row.simulacro_id == null ? null : Number(row.simulacro_id),
      orden: Number(row.orden ?? 0),
      test_total_preguntas: Number(row.test_total_preguntas ?? 0),
      simulacro_total_preguntas: Number(row.simulacro_total_preguntas ?? 0),
    }));
  },

  async getItem(itemId) {
    const result = await pool.query(
      'SELECT * FROM albacer_modulo_items WHERE id = $1 LIMIT 1',
      [itemId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...row,
      id: Number(row.id),
      modulo_id: Number(row.modulo_id),
      plantilla_test_id: row.plantilla_test_id == null ? null : Number(row.plantilla_test_id),
      simulacro_id: row.simulacro_id == null ? null : Number(row.simulacro_id),
      orden: Number(row.orden ?? 0),
    };
  },

  async hasSimulacroFinal(moduloId, exceptItemId = null) {
    const result = await pool.query(
      `SELECT 1
       FROM albacer_modulo_items
       WHERE modulo_id = $1
         AND tipo = 'simulacro_final'
         AND ($2::bigint IS NULL OR id <> $2)
       LIMIT 1`,
      [moduloId, exceptItemId],
    );
    return result.rows.length > 0;
  },

  async getNextItemOrden(moduloId) {
    const result = await pool.query(
      'SELECT COALESCE(MAX(orden), 0)::int AS max_orden FROM albacer_modulo_items WHERE modulo_id = $1',
      [moduloId],
    );
    return Number(result.rows[0]?.max_orden ?? 0) + 1;
  },

  async createItem(moduloId, payload) {
    const result = await pool.query(
      `INSERT INTO albacer_modulo_items
         (modulo_id, tipo, titulo, descripcion, plantilla_test_id, simulacro_id, orden, obligatorio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        moduloId,
        payload.tipo,
        payload.titulo,
        payload.descripcion ?? null,
        payload.plantilla_test_id ?? null,
        payload.simulacro_id ?? null,
        payload.orden,
        payload.obligatorio ?? false,
      ],
    );
    return result.rows[0];
  },

  async updateItem(itemId, payload) {
    const current = await this.getItem(itemId);
    if (!current) return null;
    const result = await pool.query(
      `UPDATE albacer_modulo_items
       SET titulo = $2,
           descripcion = $3,
           orden = $4,
           obligatorio = $5,
           actualizado_en = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        itemId,
        payload.titulo ?? current.titulo,
        Object.prototype.hasOwnProperty.call(payload, 'descripcion') ? payload.descripcion : current.descripcion,
        payload.orden ?? current.orden,
        payload.obligatorio ?? current.obligatorio,
      ],
    );
    return result.rows[0] ?? null;
  },

  async deleteItem(itemId) {
    const result = await pool.query(
      'DELETE FROM albacer_modulo_items WHERE id = $1 RETURNING *',
      [itemId],
    );
    return result.rows[0] ?? null;
  },

  async markTestAsModulo(testId, moduloId) {
    await pool.query(
      `UPDATE admin_tests
       SET scope = 'albacer_modulo',
           albacer_modulo_id = $2,
           fecha_actualizacion = NOW()
       WHERE id = $1`,
      [testId, moduloId],
    );
  },

  async unmarkTestAsModulo(testId, moduloId) {
    await pool.query(
      `UPDATE admin_tests
       SET scope = 'experto',
           albacer_modulo_id = NULL,
           fecha_actualizacion = NOW()
       WHERE id = $1 AND albacer_modulo_id = $2`,
      [testId, moduloId],
    );
  },

  async markSimulacroAsModuloFinal(simulacroId, moduloId) {
    await pool.query(
      `UPDATE simulacros
       SET scope = 'albacer_modulo_final',
           albacer_modulo_id = $2,
           fecha_actualizacion = NOW()
       WHERE id = $1`,
      [simulacroId, moduloId],
    );
  },

  async unmarkSimulacroAsModuloFinal(simulacroId, moduloId) {
    await pool.query(
      `UPDATE simulacros
       SET scope = 'experto',
           albacer_modulo_id = NULL,
           fecha_actualizacion = NOW()
       WHERE id = $1 AND albacer_modulo_id = $2`,
      [simulacroId, moduloId],
    );
  },
};
