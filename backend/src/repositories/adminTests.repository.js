import pool from '../config/db.js';

export const adminTestsRepository = {

  // ─── Listado paginado ────────────────────────────────────────────────────────
  async listTests({ q, estado, oposicionId, allowedOposicionIds, limit, offset }) {
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
         t.id, t.nombre, t.descripcion, t.estado,
         t.nivel_dificultad, t.duracion_minutos,
         t.mezclar_preguntas, t.mostrar_resultados, t.mostrar_explicaciones,
         t.tipo_puntuacion, t.fecha_creacion, t.fecha_actualizacion,
         t.oposicion_id, t.tema_id,
         o.nombre AS oposicion_nombre,
         te.nombre AS tema_nombre,
         COUNT(DISTINCT atp.pregunta_id)::int AS total_preguntas
       FROM admin_tests t
       LEFT JOIN oposiciones o ON o.id = t.oposicion_id
       LEFT JOIN temas te      ON te.id = t.tema_id
       LEFT JOIN admin_tests_preguntas atp ON atp.test_id = t.id
       WHERE ($1::text   IS NULL OR t.nombre ILIKE $1)
         AND ($2::text   IS NULL OR t.estado = $2)
         AND ($3::bigint IS NULL OR t.oposicion_id = $3)
         AND ($4::bigint[] IS NULL OR t.oposicion_id = ANY($4::bigint[]))
       GROUP BY t.id, o.nombre, te.nombre
       ORDER BY t.fecha_creacion DESC
       LIMIT $5 OFFSET $6`,
      params,
    );
    const countRow = await pool.query(
      `SELECT COUNT(*)::int AS total FROM admin_tests t
       WHERE ($1::text   IS NULL OR t.nombre ILIKE $1)
         AND ($2::text   IS NULL OR t.estado = $2)
         AND ($3::bigint IS NULL OR t.oposicion_id = $3)
         AND ($4::bigint[] IS NULL OR t.oposicion_id = ANY($4::bigint[]))`,
      [q ? `%${q}%` : null, estado ?? null, oposicionId ?? null, allowedOposicionIds ?? null],
    );
    return { items: rows.rows, total: countRow.rows[0].total };
  },

  // ─── Detalle con preguntas ───────────────────────────────────────────────────
  async getTest(id) {
    const row = await pool.query(
      `SELECT
         t.*,
         o.nombre AS oposicion_nombre,
         te.nombre AS tema_nombre
       FROM admin_tests t
       LEFT JOIN oposiciones o ON o.id = t.oposicion_id
       LEFT JOIN temas te      ON te.id = t.tema_id
       WHERE t.id = $1
       GROUP BY t.id, o.nombre, te.nombre`,
      [id],
    );
    if (row.rows.length === 0) return null;
    const test = row.rows[0];

    const pregsRow = await pool.query(
      `SELECT
         p.id, p.enunciado, p.nivel_dificultad,
         atp.orden,
         te.nombre AS tema_nombre
       FROM admin_tests_preguntas atp
       JOIN preguntas p ON p.id = atp.pregunta_id
       LEFT JOIN temas te ON te.id = p.tema_id
       WHERE atp.test_id = $1
       ORDER BY atp.orden, p.id`,
      [id],
    );
    test.preguntas = pregsRow.rows;
    return test;
  },

  // ─── Crear ───────────────────────────────────────────────────────────────────
  async createTest(fields, creadoPor) {
    const r = await pool.query(
      `INSERT INTO admin_tests
         (nombre, descripcion, oposicion_id, tema_id, estado,
          nivel_dificultad, duracion_minutos,
          mezclar_preguntas, mostrar_resultados, mostrar_explicaciones,
          tipo_puntuacion, pts_acierto, pts_fallo, pts_blanco, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        fields.nombre,
        fields.descripcion ?? null,
        fields.oposicion_id ?? null,
        fields.tema_id ?? null,
        fields.estado ?? 'borrador',
        fields.nivel_dificultad ?? null,
        fields.duracion_minutos ?? null,
        fields.mezclar_preguntas ?? true,
        fields.mostrar_resultados ?? true,
        fields.mostrar_explicaciones ?? true,
        fields.tipo_puntuacion ?? 'estandar',
        fields.pts_acierto ?? 1.0,
        fields.pts_fallo ?? -0.25,
        fields.pts_blanco ?? 0.0,
        creadoPor ?? null,
      ],
    );
    return r.rows[0];
  },

  // ─── Actualizar ──────────────────────────────────────────────────────────────
  async updateTest(id, fields) {
    const allowed = [
      'nombre', 'descripcion', 'oposicion_id', 'tema_id', 'estado',
      'nivel_dificultad', 'duracion_minutos',
      'mezclar_preguntas', 'mostrar_resultados', 'mostrar_explicaciones',
      'tipo_puntuacion', 'pts_acierto', 'pts_fallo', 'pts_blanco',
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
    setClauses.push('fecha_actualizacion = NOW()');
    values.push(id);
    const r = await pool.query(
      `UPDATE admin_tests SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return r.rows[0] ?? null;
  },

  // ─── Eliminar ────────────────────────────────────────────────────────────────
  async deleteTest(id) {
    await pool.query('DELETE FROM admin_tests WHERE id = $1', [id]);
  },

  // ─── Preguntas del test ──────────────────────────────────────────────────────
  async getTestPreguntas(testId) {
    const r = await pool.query(
      `SELECT p.id, p.enunciado, p.nivel_dificultad,
              atp.orden, te.nombre AS tema_nombre
       FROM admin_tests_preguntas atp
       JOIN preguntas p   ON p.id = atp.pregunta_id
       LEFT JOIN temas te ON te.id = p.tema_id
       WHERE atp.test_id = $1
       ORDER BY atp.orden, p.id`,
      [testId],
    );
    return r.rows;
  },

  async getTestPreguntaIds(testId) {
    const r = await pool.query(
      'SELECT pregunta_id FROM admin_tests_preguntas WHERE test_id = $1',
      [testId],
    );
    return r.rows.map((row) => Number(row.pregunta_id));
  },

  async addPreguntas(testId, preguntaIds) {
    if (!preguntaIds?.length) return;
    const maxOrdenRow = await pool.query(
      'SELECT COALESCE(MAX(orden), 0) AS max FROM admin_tests_preguntas WHERE test_id = $1',
      [testId],
    );
    let orden = maxOrdenRow.rows[0].max;
    for (const pid of preguntaIds) {
      orden += 1;
      await pool.query(
        `INSERT INTO admin_tests_preguntas (test_id, pregunta_id, orden)
         VALUES ($1, $2, $3)
         ON CONFLICT (test_id, pregunta_id) DO NOTHING`,
        [testId, pid, orden],
      );
    }
  },

  async removePregunta(testId, preguntaId) {
    await pool.query(
      'DELETE FROM admin_tests_preguntas WHERE test_id = $1 AND pregunta_id = $2',
      [testId, preguntaId],
    );
  },

};
