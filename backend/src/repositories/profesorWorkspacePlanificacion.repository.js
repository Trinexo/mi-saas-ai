import pool from '../config/db.js';

const planificacionSelect = `
  pa.id, pa.creado_por_usuario_id, pa.creado_por_rol,
  pa.oposicion_id, o.nombre AS oposicion_nombre,
  pa.destinatario_tipo, pa.tipo, pa.estado,
  pa.titulo, pa.descripcion, pa.fecha_inicio, pa.fecha_fin, pa.duracion_minutos,
  pa.simulacro_id, s.nombre AS simulacro_nombre, s.estado AS simulacro_estado,
  pa.plantilla_test_id, at.nombre AS plantilla_test_nombre, at.estado AS plantilla_test_estado,
  pa.numero_preguntas, pa.dificultad, pa.modo_test,
  pa.intentos_maximos, pa.permitir_reintento,
  pa.resultados_visibles_desde, pa.revision_visible_desde,
  pa.notificar_alumnos, pa.notificada_en, pa.creado_en, pa.actualizado_en,
  COALESCE(ps.intentos_total, 0)::int AS intentos_total,
  COALESCE(ps.alumnos_iniciados, 0)::int AS alumnos_iniciados,
  COALESCE(ps.completados, 0)::int AS completados,
  COALESCE(ps.nota_media, 0)::numeric AS nota_media,
  COALESCE(ps.tiempo_medio_segundos, 0)::int AS tiempo_medio_segundos,
  CASE
    WHEN pa.estado <> 'publicada' THEN pa.estado
    WHEN pa.tipo = 'plantilla_test' AND COALESCE(at.estado, 'borrador') <> 'publicado' THEN 'bloqueada'
    WHEN pa.tipo = 'simulacro' AND COALESCE(s.estado, 'borrador') <> 'publicado' THEN 'bloqueada'
    ELSE pa.estado
  END AS estado_profesor,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object('id', t.id, 'nombre', t.nombre)
    ) FILTER (WHERE t.id IS NOT NULL),
    '[]'
  ) AS temas
`;

const planificacionJoins = `
  JOIN oposiciones o ON o.id = pa.oposicion_id
  LEFT JOIN simulacros s ON s.id = pa.simulacro_id
  LEFT JOIN admin_tests at ON at.id = pa.plantilla_test_id
  LEFT JOIN planificacion_academica_temas pat ON pat.planificacion_id = pa.id
  LEFT JOIN temas t ON t.id = pat.tema_id
  LEFT JOIN (
    SELECT
      tx.planificacion_id,
      COUNT(tx.id)::int AS intentos_total,
      COUNT(DISTINCT tx.usuario_id)::int AS alumnos_iniciados,
      COUNT(tx.id) FILTER (WHERE tx.estado = 'finalizado')::int AS completados,
      ROUND(AVG(rt.nota) FILTER (WHERE tx.estado = 'finalizado'), 2) AS nota_media,
      ROUND(AVG(rt.tiempo_segundos) FILTER (WHERE tx.estado = 'finalizado'))::int AS tiempo_medio_segundos
    FROM tests tx
    LEFT JOIN resultados_test rt ON rt.test_id = tx.id
    WHERE tx.planificacion_id IS NOT NULL
    GROUP BY tx.planificacion_id
  ) ps ON ps.planificacion_id = pa.id
`;

const planificacionGroupBy = `
  pa.id, o.nombre, s.nombre, s.estado, at.nombre, at.estado,
  ps.intentos_total, ps.alumnos_iniciados, ps.completados, ps.nota_media, ps.tiempo_medio_segundos
`;

export const profesorWorkspacePlanificacionRepository = {
  async listForProfesor({ userId, oposicionId, desde, hasta }) {
    const args = [userId];
    const where = [
      'pa.creado_por_usuario_id = $1',
      `EXISTS (
        SELECT 1 FROM profesores_oposiciones po
        WHERE po.user_id = $1 AND po.oposicion_id = pa.oposicion_id
      )`,
    ];

    if (oposicionId) { args.push(oposicionId); where.push(`pa.oposicion_id = $${args.length}`); }
    if (desde)       { args.push(desde);       where.push(`pa.fecha_inicio >= $${args.length}`); }
    if (hasta)       { args.push(hasta);       where.push(`pa.fecha_inicio <= $${args.length}`); }

    const result = await pool.query(
      `SELECT ${planificacionSelect}
       FROM planificaciones_academicas pa
       ${planificacionJoins}
       WHERE ${where.join(' AND ')}
       GROUP BY ${planificacionGroupBy}
       ORDER BY pa.fecha_inicio ASC, pa.id ASC`,
      args,
    );
    return result.rows;
  },

  async getForProfesor(id, userId) {
    const result = await pool.query(
      `SELECT ${planificacionSelect}
       FROM planificaciones_academicas pa
       ${planificacionJoins}
       WHERE pa.id = $1
         AND pa.creado_por_usuario_id = $2
         AND EXISTS (
           SELECT 1 FROM profesores_oposiciones po
           WHERE po.user_id = $2 AND po.oposicion_id = pa.oposicion_id
         )
       GROUP BY ${planificacionGroupBy}`,
      [id, userId],
    );
    return result.rows[0] ?? null;
  },

  async create(fields) {
    const result = await pool.query(
      `INSERT INTO planificaciones_academicas (
         creado_por_usuario_id, creado_por_rol, oposicion_id, destinatario_tipo,
         tipo, estado, titulo, descripcion, fecha_inicio, fecha_fin, duracion_minutos,
         simulacro_id, plantilla_test_id, numero_preguntas, dificultad, modo_test,
         intentos_maximos, permitir_reintento, resultados_visibles_desde,
         revision_visible_desde, notificar_alumnos
       )
       VALUES (
         $1, $2, $3, 'oposicion',
         $4, $5, $6, $7, $8, $9, $10,
         $11, $12, $13, $14, $15,
         $16, $17, $18, $19, $20
       )
       RETURNING *`,
      [
        fields.creado_por_usuario_id,
        fields.creado_por_rol,
        fields.oposicion_id,
        fields.tipo,
        fields.estado,
        fields.titulo,
        fields.descripcion ?? null,
        fields.fecha_inicio,
        fields.fecha_fin ?? null,
        fields.duracion_minutos ?? null,
        fields.simulacro_id ?? null,
        fields.plantilla_test_id ?? null,
        fields.numero_preguntas ?? null,
        fields.dificultad ?? null,
        fields.modo_test ?? null,
        fields.intentos_maximos ?? null,
        fields.permitir_reintento ?? true,
        fields.resultados_visibles_desde ?? 'inmediato',
        fields.revision_visible_desde ?? 'inmediato',
        fields.notificar_alumnos ?? false,
      ],
    );
    return result.rows[0];
  },

  async update(id, fields) {
    const current = await pool.query('SELECT * FROM planificaciones_academicas WHERE id = $1', [id]);
    if (current.rows.length === 0) return null;
    const merged = { ...current.rows[0], ...fields };

    const result = await pool.query(
      `UPDATE planificaciones_academicas SET
         oposicion_id = $2,
         tipo = $3,
         estado = $4,
         titulo = $5,
         descripcion = $6,
         fecha_inicio = $7,
         fecha_fin = $8,
         duracion_minutos = $9,
         simulacro_id = $10,
         plantilla_test_id = $11,
         numero_preguntas = $12,
         dificultad = $13,
         modo_test = $14,
         intentos_maximos = $15,
         permitir_reintento = $16,
         resultados_visibles_desde = $17,
         revision_visible_desde = $18,
         notificar_alumnos = $19,
         actualizado_en = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        merged.oposicion_id,
        merged.tipo,
        merged.estado,
        merged.titulo,
        merged.descripcion ?? null,
        merged.fecha_inicio,
        merged.fecha_fin ?? null,
        merged.duracion_minutos ?? null,
        merged.simulacro_id ?? null,
        merged.plantilla_test_id ?? null,
        merged.numero_preguntas ?? null,
        merged.dificultad ?? null,
        merged.modo_test ?? null,
        merged.intentos_maximos ?? null,
        merged.permitir_reintento ?? true,
        merged.resultados_visibles_desde ?? 'inmediato',
        merged.revision_visible_desde ?? 'inmediato',
        merged.notificar_alumnos ?? false,
      ],
    );
    return result.rows[0] ?? null;
  },

  async replaceTemas(planificacionId, temaIds) {
    await pool.query('DELETE FROM planificacion_academica_temas WHERE planificacion_id = $1', [planificacionId]);
    if (!temaIds?.length) return;
    const values = temaIds.map((_, index) => `($1, $${index + 2})`).join(', ');
    await pool.query(
      `INSERT INTO planificacion_academica_temas (planificacion_id, tema_id)
       VALUES ${values}
       ON CONFLICT DO NOTHING`,
      [planificacionId, ...temaIds],
    );
  },

  async archive(id) {
    const result = await pool.query(
      `UPDATE planificaciones_academicas
       SET estado = 'archivada', actualizado_en = NOW()
       WHERE id = $1
       RETURNING id`,
      [id],
    );
    return result.rowCount > 0;
  },

  async getDependencyOposicion({ tipo, plantillaTestId, simulacroId }) {
    if (tipo === 'plantilla_test' && plantillaTestId) {
      const result = await pool.query(
        'SELECT id, oposicion_id, estado FROM admin_tests WHERE id = $1',
        [plantillaTestId],
      );
      return result.rows[0] ?? null;
    }
    if (tipo === 'simulacro' && simulacroId) {
      const result = await pool.query(
        'SELECT id, oposicion_id, estado, creado_por FROM simulacros WHERE id = $1',
        [simulacroId],
      );
      return result.rows[0] ?? null;
    }
    return null;
  },

  async countTemasInOposicion(oposicionId, temaIds) {
    if (!temaIds?.length) return 0;
    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM temas
       WHERE oposicion_id = $1 AND id = ANY($2::bigint[])`,
      [oposicionId, temaIds],
    );
    return result.rows[0].total;
  },

  async listActiveAlumnoIds(oposicionId) {
    const result = await pool.query(
      `SELECT usuario_id
       FROM accesos_oposicion
       WHERE oposicion_id = $1
         AND estado = 'activo'
         AND (fecha_fin IS NULL OR fecha_fin > NOW())`,
      [oposicionId],
    );
    return result.rows.map((row) => Number(row.usuario_id));
  },

  async markNotificada(id) {
    await pool.query(
      `UPDATE planificaciones_academicas
       SET notificada_en = NOW(), actualizado_en = NOW()
       WHERE id = $1 AND notificada_en IS NULL`,
      [id],
    );
  },

  async listResultados({ planificacionId, oposicionId, limit, offset }) {
    const alumnos = await pool.query(
      `SELECT
         u.id AS alumno_id,
         u.nombre AS alumno_nombre,
         u.email AS alumno_email,
         COUNT(tx.id)::int AS intentos,
         COUNT(tx.id) FILTER (WHERE tx.estado = 'finalizado')::int AS completados,
         ROUND(AVG(rt.nota) FILTER (WHERE tx.estado = 'finalizado'), 2) AS nota_media,
         ROUND(MAX(rt.nota) FILTER (WHERE tx.estado = 'finalizado'), 2) AS mejor_nota,
         MAX(COALESCE(tx.fecha_fin, tx.fecha_creacion)) AS ultima_actividad,
         last_tx.id AS ultimo_test_id,
         last_tx.estado AS ultimo_estado,
         last_tx.nota AS ultima_nota,
         last_tx.aciertos AS ultimos_aciertos,
         last_tx.errores AS ultimos_errores,
         last_tx.blancos AS ultimos_blancos,
         last_tx.tiempo_segundos AS ultimo_tiempo_segundos
       FROM accesos_oposicion ao
       JOIN usuarios u ON u.id = ao.usuario_id
       LEFT JOIN tests tx
         ON tx.usuario_id = u.id
        AND tx.planificacion_id = $1
       LEFT JOIN resultados_test rt ON rt.test_id = tx.id
       LEFT JOIN LATERAL (
         SELECT
           t.id, t.estado, r.nota, r.aciertos, r.errores, r.blancos, r.tiempo_segundos,
           COALESCE(t.fecha_fin, t.fecha_creacion) AS fecha
         FROM tests t
         LEFT JOIN resultados_test r ON r.test_id = t.id
         WHERE t.usuario_id = u.id
           AND t.planificacion_id = $1
         ORDER BY COALESCE(t.fecha_fin, t.fecha_creacion) DESC, t.id DESC
         LIMIT 1
       ) last_tx ON TRUE
       WHERE ao.oposicion_id = $2
         AND ao.estado = 'activo'
         AND (ao.fecha_fin IS NULL OR ao.fecha_fin > NOW())
       GROUP BY
         u.id, u.nombre, u.email,
         last_tx.id, last_tx.estado, last_tx.nota, last_tx.aciertos,
         last_tx.errores, last_tx.blancos, last_tx.tiempo_segundos
       ORDER BY
         completados ASC,
         ultima_actividad DESC NULLS LAST,
         u.nombre ASC
       LIMIT $3 OFFSET $4`,
      [planificacionId, oposicionId, limit, offset],
    );

    const total = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM accesos_oposicion ao
       WHERE ao.oposicion_id = $1
         AND ao.estado = 'activo'
         AND (ao.fecha_fin IS NULL OR ao.fecha_fin > NOW())`,
      [oposicionId],
    );

    return { items: alumnos.rows, total: total.rows[0]?.total ?? 0 };
  },

  async listAlumnoIdsPendientes(planificacionId, oposicionId) {
    const result = await pool.query(
      `SELECT ao.usuario_id
       FROM accesos_oposicion ao
       WHERE ao.oposicion_id = $2
         AND ao.estado = 'activo'
         AND (ao.fecha_fin IS NULL OR ao.fecha_fin > NOW())
         AND NOT EXISTS (
           SELECT 1
           FROM tests tx
           WHERE tx.planificacion_id = $1
             AND tx.usuario_id = ao.usuario_id
             AND tx.estado = 'finalizado'
         )`,
      [planificacionId, oposicionId],
    );
    return result.rows.map((row) => Number(row.usuario_id));
  },

  async listForAlumno({ userId, oposicionId }) {
    const result = await pool.query(
      `SELECT ${planificacionSelect},
              CASE
                WHEN EXISTS (
                  SELECT 1 FROM tests tx
                  WHERE tx.planificacion_id = pa.id
                    AND tx.usuario_id = $2
                    AND tx.estado = 'finalizado'
                ) THEN 'completado'
                WHEN pa.fecha_inicio > NOW() THEN 'proximo'
                WHEN pa.fecha_fin IS NOT NULL AND pa.fecha_fin < NOW() THEN 'cerrado'
                ELSE 'disponible'
              END AS estado_alumno,
              COUNT(DISTINCT tx.id)::int AS intentos_usados,
              (
                SELECT ROUND(MAX(rt2.nota), 1)
                FROM tests tx2
                JOIN resultados_test rt2 ON rt2.test_id = tx2.id
                WHERE tx2.planificacion_id = pa.id
                  AND tx2.usuario_id = $2
                  AND tx2.estado = 'finalizado'
              ) AS mi_mejor_nota
       FROM planificaciones_academicas pa
       ${planificacionJoins}
       LEFT JOIN tests tx ON tx.planificacion_id = pa.id AND tx.usuario_id = $2
       WHERE pa.oposicion_id = $1
         AND pa.estado = 'publicada'
         AND EXISTS (
           SELECT 1 FROM accesos_oposicion ao
           WHERE ao.usuario_id = $2
             AND ao.oposicion_id = pa.oposicion_id
             AND ao.estado = 'activo'
             AND (ao.fecha_fin IS NULL OR ao.fecha_fin > NOW())
         )
         AND NOT (pa.tipo = 'plantilla_test' AND COALESCE(at.estado, 'borrador') <> 'publicado')
         AND NOT (pa.tipo = 'simulacro' AND COALESCE(s.estado, 'borrador') <> 'publicado')
       GROUP BY ${planificacionGroupBy}
       ORDER BY pa.fecha_inicio ASC, pa.id ASC`,
      [oposicionId, userId],
    );
    return result.rows;
  },

  async getForAlumno(id, userId) {
    const result = await pool.query(
      `SELECT ${planificacionSelect},
              CASE
                WHEN EXISTS (
                  SELECT 1 FROM tests tx
                  WHERE tx.planificacion_id = pa.id
                    AND tx.usuario_id = $2
                    AND tx.estado = 'finalizado'
                ) THEN 'completado'
                WHEN pa.fecha_inicio > NOW() THEN 'proximo'
                WHEN pa.fecha_fin IS NOT NULL AND pa.fecha_fin < NOW() THEN 'cerrado'
                ELSE 'disponible'
              END AS estado_alumno,
              COUNT(DISTINCT tx.id)::int AS intentos_usados,
              (
                SELECT ROUND(MAX(rt2.nota), 1)
                FROM tests tx2
                JOIN resultados_test rt2 ON rt2.test_id = tx2.id
                WHERE tx2.planificacion_id = pa.id
                  AND tx2.usuario_id = $2
                  AND tx2.estado = 'finalizado'
              ) AS mi_mejor_nota
       FROM planificaciones_academicas pa
       ${planificacionJoins}
       LEFT JOIN tests tx ON tx.planificacion_id = pa.id AND tx.usuario_id = $2
       WHERE pa.id = $1
         AND pa.estado = 'publicada'
         AND EXISTS (
           SELECT 1 FROM accesos_oposicion ao
           WHERE ao.usuario_id = $2
             AND ao.oposicion_id = pa.oposicion_id
             AND ao.estado = 'activo'
             AND (ao.fecha_fin IS NULL OR ao.fecha_fin > NOW())
         )
         AND NOT (pa.tipo = 'plantilla_test' AND COALESCE(at.estado, 'borrador') <> 'publicado')
         AND NOT (pa.tipo = 'simulacro' AND COALESCE(s.estado, 'borrador') <> 'publicado')
       GROUP BY ${planificacionGroupBy}`,
      [id, userId],
    );
    return result.rows[0] ?? null;
  },
};
