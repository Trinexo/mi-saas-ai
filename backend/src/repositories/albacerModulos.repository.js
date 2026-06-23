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
};
