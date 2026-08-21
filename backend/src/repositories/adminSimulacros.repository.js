import pool from '../config/db.js';

export const configuredExamMatchSql = (configAlias = 'c', questionAlias = 'p') => `
              CASE WHEN EXISTS (
                SELECT 1 FROM simulacros_configuracion_examenes ce0
                WHERE ce0.simulacro_id = ${configAlias}.simulacro_id
              ) THEN EXISTS (
                SELECT 1
                  FROM examenes_oficiales_preguntas ep
                  JOIN simulacros_configuracion_examenes ce
                    ON ce.examen_id = ep.examen_id
                 WHERE ep.pregunta_id = ${questionAlias}.id
                   AND ce.simulacro_id = ${configAlias}.simulacro_id
              ) ELSE (
                ${configAlias}.examen_id IS NULL OR EXISTS (
                  SELECT 1 FROM examenes_oficiales_preguntas ep
                  WHERE ep.pregunta_id = ${questionAlias}.id
                    AND ep.examen_id = ${configAlias}.examen_id
                )
              ) END`;

export const adminSimulacrosRepository = {
  // ─── Listado con paginación y filtros ────────────────────────────────────────
  async listSimulacros({ q, estado, oposicionId, allowedOposicionIds, scope, limit, offset }) {
    const params = [
      q ? `%${q}%` : null,
      estado ?? null,
      oposicionId ?? null,
      allowedOposicionIds ?? null,
      scope ?? null,
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
         COALESCE(s.scope, 'experto') AS scope,
         s.albacer_modulo_id,
         COUNT(DISTINCT sb.id)::int AS total_bloques,
         COALESCE(SUM(sb.numero_preguntas), 0)::int AS total_preguntas
       FROM simulacros s
       LEFT JOIN oposiciones o      ON o.id = s.oposicion_id
       LEFT JOIN simulacros_bloques sb ON sb.simulacro_id = s.id
       WHERE ($1::text IS NULL OR s.nombre ILIKE $1)
         AND ($2::text IS NULL OR s.estado = $2)
         AND ($3::bigint IS NULL OR s.oposicion_id = $3)
         AND ($4::bigint[] IS NULL OR s.oposicion_id = ANY($4::bigint[]))
         AND (
           ($5::text IS NULL
             AND COALESCE(s.scope, 'experto') <> 'albacer_modulo_final'
             AND s.albacer_modulo_id IS NULL
             AND NOT EXISTS (
               SELECT 1
               FROM albacer_modulo_items mi
               WHERE mi.simulacro_id = s.id
             )
           )
           OR COALESCE(s.scope, 'experto') = $5
         )
       GROUP BY s.id, o.nombre
       ORDER BY s.fecha_creacion DESC
       LIMIT $6 OFFSET $7`,
      params,
    );
    const countRow = await pool.query(
      `SELECT COUNT(*)::int AS total FROM simulacros s
       WHERE ($1::text IS NULL OR s.nombre ILIKE $1)
         AND ($2::text IS NULL OR s.estado = $2)
         AND ($3::bigint IS NULL OR s.oposicion_id = $3)
         AND ($4::bigint[] IS NULL OR s.oposicion_id = ANY($4::bigint[]))
         AND (
           ($5::text IS NULL
             AND COALESCE(s.scope, 'experto') <> 'albacer_modulo_final'
             AND s.albacer_modulo_id IS NULL
             AND NOT EXISTS (
               SELECT 1
               FROM albacer_modulo_items mi
               WHERE mi.simulacro_id = s.id
             )
           )
           OR COALESCE(s.scope, 'experto') = $5
         )`,
      [q ? `%${q}%` : null, estado ?? null, oposicionId ?? null, allowedOposicionIds ?? null, scope ?? null],
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
    const configRow = await pool.query(
      `SELECT c.simulacro_id, c.total_preguntas, c.dificultad, c.officialidad,
              c.reparto_por_tema, c.examen_id,
              COALESCE((SELECT json_agg(json_build_object('tema_id', t.tema_id::text, 'cantidad', t.cantidad)
                                       ORDER BY t.tema_id)
                        FROM simulacros_configuracion_temas t
                       WHERE t.simulacro_id = c.simulacro_id), '[]'::json) AS temas,
              COALESCE((SELECT json_agg(a.oposicion_anio_id::text ORDER BY a.oposicion_anio_id)
                        FROM simulacros_configuracion_anios a
                       WHERE a.simulacro_id = c.simulacro_id), '[]'::json) AS anio_ids
              ,COALESCE((SELECT json_agg(e.examen_id::text ORDER BY e.examen_id)
                        FROM simulacros_configuracion_examenes e
                       WHERE e.simulacro_id = c.simulacro_id),
                       CASE WHEN c.examen_id IS NULL THEN '[]'::json ELSE json_build_array(c.examen_id::text) END) AS examen_ids
         FROM simulacros_configuracion_preguntas c
        WHERE c.simulacro_id = $1`,
      [id],
    );
    simulacro.configuracion_preguntas = configRow.rows[0] ?? null;
    return simulacro;
  },

  async saveConfiguracionPreguntas(simulacroId, config) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO simulacros_configuracion_preguntas
           (simulacro_id, total_preguntas, dificultad, officialidad, reparto_por_tema, examen_id)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (simulacro_id) DO UPDATE SET
           total_preguntas=EXCLUDED.total_preguntas, dificultad=EXCLUDED.dificultad,
           officialidad=EXCLUDED.officialidad, reparto_por_tema=EXCLUDED.reparto_por_tema,
           examen_id=EXCLUDED.examen_id`,
        [simulacroId, config.total_preguntas, config.dificultad ?? null, config.officialidad, config.reparto_por_tema, config.examen_id ?? config.examen_ids?.[0] ?? null],
      );
      await client.query('DELETE FROM simulacros_configuracion_temas WHERE simulacro_id = $1', [simulacroId]);
      if (config.temas?.length) {
        for (const tema of config.temas) {
          await client.query(
            `INSERT INTO simulacros_configuracion_temas (simulacro_id, tema_id, cantidad)
             VALUES ($1,$2,$3)`,
            [simulacroId, tema.tema_id, tema.cantidad ?? null],
          );
        }
      }
      await client.query('DELETE FROM simulacros_configuracion_anios WHERE simulacro_id = $1', [simulacroId]);
      for (const anioId of config.anio_ids ?? []) {
        await client.query(
          `INSERT INTO simulacros_configuracion_anios (simulacro_id, oposicion_anio_id)
           VALUES ($1,$2)`,
          [simulacroId, anioId],
        );
      }
      await client.query('DELETE FROM simulacros_configuracion_examenes WHERE simulacro_id = $1', [simulacroId]);
      const examenIds = config.examen_ids?.length
        ? [...new Set(config.examen_ids.map(String))]
        : (config.examen_id != null ? [String(config.examen_id)] : []);
      for (const examenId of examenIds) {
        await client.query(
          `INSERT INTO simulacros_configuracion_examenes (simulacro_id, examen_id)
           VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [simulacroId, examenId],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return this.getSimulacro(simulacroId);
  },

  async getOfficialFilterScope(oposicionId, anioIds = [], examenIds = []) {
    const [years, exams] = await Promise.all([
      pool.query(
        `SELECT id::text AS id, oposicion_id::text AS oposicion_id, anio
           FROM oposiciones_anios_oficiales
          WHERE oposicion_id = $1 AND id = ANY($2::bigint[])`,
        [oposicionId, anioIds],
      ),
      pool.query(
        `SELECT id::text AS id, oposicion_id::text AS oposicion_id,
                oposicion_anio_id::text AS oposicion_anio_id, anio
           FROM examenes_oficiales
          WHERE oposicion_id = $1 AND id = ANY($2::bigint[])`,
        [oposicionId, examenIds],
      ),
    ]);
    return { years: years.rows, exams: exams.rows };
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

  async getBloquePreguntaIds(bloqueId) {
    const result = await pool.query(
      'SELECT pregunta_id FROM simulacros_preguntas WHERE bloque_id = $1',
      [bloqueId],
    );
    return result.rows.map((row) => row.pregunta_id);
  },

  async getPreguntaTopicIds(preguntaIds) {
    if (!preguntaIds?.length) return [];
    const result = await pool.query(
      'SELECT id, tema_id FROM preguntas WHERE id = ANY($1::bigint[])',
      [preguntaIds],
    );
    return result.rows;
  },

  async getPreguntasForAssignmentValidation(simulacroId, preguntaIds) {
    if (!preguntaIds?.length) return [];
    const result = await pool.query(
      `SELECT p.id, p.tema_id, t.oposicion_id, p.estado, p.nivel_dificultad,
              c.dificultad, c.officialidad, c.examen_id, c.reparto_por_tema,
              EXISTS (SELECT 1 FROM preguntas_anios_oficiales pa
                      WHERE pa.pregunta_id = p.id) AS es_oficial,
              EXISTS (SELECT 1
                        FROM preguntas_anios_oficiales pa
                        JOIN simulacros_configuracion_anios ca
                          ON ca.oposicion_anio_id = pa.oposicion_anio_id
                       WHERE pa.pregunta_id = p.id
                         AND ca.simulacro_id = c.simulacro_id) AS coincide_anio,
              ${configuredExamMatchSql('c', 'p')} AS coincide_examen,
              EXISTS (SELECT 1
                        FROM simulacros_configuracion_temas ct
                       WHERE ct.simulacro_id = c.simulacro_id
                         AND ct.tema_id = p.tema_id) AS tema_configurado
         FROM preguntas p
         JOIN temas t ON t.id = p.tema_id
         JOIN simulacros_configuracion_preguntas c ON c.simulacro_id = $1
        WHERE p.id = ANY($2::bigint[])`,
      [simulacroId, preguntaIds],
    );
    return result.rows;
  },

  async getConfiguracionPreguntasValidation(simulacroId) {
    const result = await pool.query(
      `SELECT p.id, p.tema_id, t.oposicion_id, p.estado, p.nivel_dificultad,
              EXISTS (SELECT 1 FROM preguntas_anios_oficiales pa
                      WHERE pa.pregunta_id = p.id) AS es_oficial,
              EXISTS (SELECT 1
                        FROM preguntas_anios_oficiales pa
                        JOIN simulacros_configuracion_anios ca
                          ON ca.oposicion_anio_id = pa.oposicion_anio_id
                       WHERE pa.pregunta_id = p.id AND ca.simulacro_id = sb.simulacro_id) AS coincide_anio,
              ${configuredExamMatchSql('c', 'p')} AS coincide_examen
         FROM simulacros s
         JOIN simulacros_configuracion_preguntas c ON c.simulacro_id = s.id
         JOIN simulacros_bloques sb ON sb.simulacro_id = s.id
         LEFT JOIN simulacros_preguntas sp ON sp.bloque_id = sb.id
         LEFT JOIN preguntas p ON p.id = sp.pregunta_id
         LEFT JOIN temas t ON t.id = p.tema_id
        WHERE s.id = $1 AND p.id IS NOT NULL`,
      [simulacroId],
    );
    return result.rows;
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
