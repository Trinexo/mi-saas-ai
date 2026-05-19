import pool from '../config/db.js';

export const adminSimulacrosRepository = {
  // ─── Listado con paginación y filtros ────────────────────────────────────────
  async listSimulacros({ q, estado, oposicionId, allowedOposicionIds, limit, offset }) {
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
         s.id, s.nombre, s.descripcion, s.estado,
         s.tiempo_limite_segundos, s.puntuacion_maxima, s.penalizacion,
         s.mostrar_resultados_al_final, s.fecha_publicacion,
         s.creado_por, s.fecha_creacion, s.fecha_actualizacion,
         o.nombre      AS oposicion_nombre,
         s.oposicion_id,
         COUNT(DISTINCT sb.id)::int AS total_bloques,
         COALESCE(SUM(sb.numero_preguntas), 0)::int AS total_preguntas
       FROM simulacros s
       LEFT JOIN oposiciones o      ON o.id = s.oposicion_id
       LEFT JOIN simulacros_bloques sb ON sb.simulacro_id = s.id
       WHERE ($1::text IS NULL OR s.nombre ILIKE $1)
         AND ($2::text IS NULL OR s.estado = $2)
         AND ($3::bigint IS NULL OR s.oposicion_id = $3)
         AND ($4::bigint[] IS NULL OR s.oposicion_id = ANY($4::bigint[]))
       GROUP BY s.id, o.nombre
       ORDER BY s.fecha_creacion DESC
       LIMIT $5 OFFSET $6`,
      params,
    );
    const countRow = await pool.query(
      `SELECT COUNT(*)::int AS total FROM simulacros s
       WHERE ($1::text IS NULL OR s.nombre ILIKE $1)
         AND ($2::text IS NULL OR s.estado = $2)
         AND ($3::bigint IS NULL OR s.oposicion_id = $3)
         AND ($4::bigint[] IS NULL OR s.oposicion_id = ANY($4::bigint[]))`,
      [q ? `%${q}%` : null, estado ?? null, oposicionId ?? null, allowedOposicionIds ?? null],
    );
    return { items: rows.rows, total: countRow.rows[0].total };
  },

  // ─── Detalle con bloques y preguntas ─────────────────────────────────────────
  async getSimulacro(id) {
    const simRow = await pool.query(
      `SELECT s.*, o.nombre AS oposicion_nombre
       FROM simulacros s
       LEFT JOIN oposiciones o ON o.id = s.oposicion_id
       WHERE s.id = $1`,
      [id],
    );
    if (simRow.rows.length === 0) return null;
    const simulacro = simRow.rows[0];

    const bloquesRow = await pool.query(
      `SELECT sb.id, sb.nombre, sb.orden, sb.numero_preguntas,
              json_agg(
                json_build_object(
                  'id', p.id, 'enunciado', p.enunciado,
                  'nivel_dificultad', p.nivel_dificultad, 'orden', sp.orden
                ) ORDER BY sp.orden
              ) FILTER (WHERE p.id IS NOT NULL) AS preguntas
       FROM simulacros_bloques sb
       LEFT JOIN simulacros_preguntas sp ON sp.bloque_id = sb.id
       LEFT JOIN preguntas p ON p.id = sp.pregunta_id
       WHERE sb.simulacro_id = $1
       GROUP BY sb.id
       ORDER BY sb.orden`,
      [id],
    );
    simulacro.bloques = bloquesRow.rows;
    return simulacro;
  },

  // ─── Crear simulacro ─────────────────────────────────────────────────────────
  async createSimulacro(fields, creadoPor) {
    const r = await pool.query(
      `INSERT INTO simulacros
         (nombre, descripcion, oposicion_id, estado, tiempo_limite_segundos,
          puntuacion_maxima, penalizacion, mostrar_resultados_al_final,
          fecha_publicacion, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        fields.nombre,
        fields.descripcion ?? null,
        fields.oposicion_id ?? null,
        fields.estado ?? 'borrador',
        fields.tiempo_limite_segundos ?? null,
        fields.puntuacion_maxima ?? 100,
        fields.penalizacion ?? 0,
        fields.mostrar_resultados_al_final ?? true,
        fields.fecha_publicacion ?? null,
        creadoPor,
      ],
    );
    return r.rows[0];
  },

  // ─── Actualizar simulacro ─────────────────────────────────────────────────────
  async updateSimulacro(id, fields) {
    const allowed = [
      'nombre', 'descripcion', 'oposicion_id', 'estado',
      'tiempo_limite_segundos', 'puntuacion_maxima', 'penalizacion',
      'mostrar_resultados_al_final', 'fecha_publicacion',
    ];
    const setClauses = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        values.push(fields[key]);
        setClauses.push(`${key} = $${values.length}`);
      }
    }
    if (setClauses.length === 0) return null;
    setClauses.push(`fecha_actualizacion = NOW()`);
    values.push(id);
    const r = await pool.query(
      `UPDATE simulacros SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return r.rows[0] ?? null;
  },

  // ─── Eliminar simulacro ───────────────────────────────────────────────────────
  async deleteSimulacro(id) {
    const r = await pool.query('DELETE FROM simulacros WHERE id = $1 RETURNING id', [id]);
    return r.rows[0] ?? null;
  },

  // ─── Bloques ─────────────────────────────────────────────────────────────────
  async createBloque(simulacroId, fields) {
    const r = await pool.query(
      `INSERT INTO simulacros_bloques (simulacro_id, nombre, orden, numero_preguntas)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        simulacroId,
        fields.nombre,
        fields.orden ?? 0,
        fields.numero_preguntas ?? 0,
      ],
    );
    return r.rows[0];
  },

  async bloqueBelongsToSimulacro(simulacroId, bloqueId) {
    const result = await pool.query(
      'SELECT 1 FROM simulacros_bloques WHERE simulacro_id = $1 AND id = $2 LIMIT 1',
      [simulacroId, bloqueId],
    );
    return result.rows.length > 0;
  },

  async getSimulacroPreguntaIds(simulacroId) {
    const result = await pool.query(
      `SELECT sp.pregunta_id
       FROM simulacros_preguntas sp
       JOIN simulacros_bloques sb ON sb.id = sp.bloque_id
       WHERE sb.simulacro_id = $1`,
      [simulacroId],
    );
    return result.rows.map((row) => Number(row.pregunta_id));
  },

  async updateBloque(bloqueId, fields) {
    const setClauses = [];
    const values = [];
    if (fields.nombre !== undefined) { values.push(fields.nombre); setClauses.push(`nombre = $${values.length}`); }
    if (fields.orden !== undefined)  { values.push(fields.orden);  setClauses.push(`orden = $${values.length}`); }
    if (fields.numero_preguntas !== undefined) {
      values.push(fields.numero_preguntas);
      setClauses.push(`numero_preguntas = $${values.length}`);
    }
    if (setClauses.length === 0) return null;
    values.push(bloqueId);
    const r = await pool.query(
      `UPDATE simulacros_bloques SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return r.rows[0] ?? null;
  },

  async deleteBloque(bloqueId) {
    const r = await pool.query('DELETE FROM simulacros_bloques WHERE id = $1 RETURNING id', [bloqueId]);
    return r.rows[0] ?? null;
  },

  // ─── Preguntas del bloque ─────────────────────────────────────────────────────
  async asignarPreguntas(bloqueId, preguntaIds) {
    if (preguntaIds.length === 0) return [];
    const values = preguntaIds.map((pid, i) => `($1, $${i + 2}, ${i})`).join(', ');
    const r = await pool.query(
      `INSERT INTO simulacros_preguntas (bloque_id, pregunta_id, orden)
       VALUES ${values}
       ON CONFLICT (bloque_id, pregunta_id) DO NOTHING
       RETURNING *`,
      [bloqueId, ...preguntaIds],
    );
    return r.rows;
  },

  async quitarPregunta(bloqueId, preguntaId) {
    const r = await pool.query(
      'DELETE FROM simulacros_preguntas WHERE bloque_id=$1 AND pregunta_id=$2 RETURNING id',
      [bloqueId, preguntaId],
    );
    return r.rows[0] ?? null;
  },
};
