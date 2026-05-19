import pool from '../config/db.js';

const assignedWhere = `EXISTS (
  SELECT 1 FROM profesores_oposiciones po
  WHERE po.user_id = $1 AND po.oposicion_id = o.id
)`;

const questionAssignedJoin = `
  JOIN temas te ON te.id = p.tema_id
  JOIN oposiciones o ON o.id = te.oposicion_id
`;

export const profesorWorkspaceAnalyticsRepository = {
  async listOposiciones(userId) {
    const result = await pool.query(
      `SELECT
         o.id,
         o.nombre,
         o.slug,
         o.categoria,
         o.estado,
         COUNT(DISTINCT ao.usuario_id)::int AS alumnos_activos,
         COUNT(DISTINCT te.id)::int AS total_temas,
         COUNT(DISTINCT p.id)::int AS total_preguntas,
         COUNT(DISTINCT at.id)::int AS total_plantillas_test,
         COUNT(DISTINCT s.id)::int AS total_simulacros,
         COUNT(DISTINCT rp.id) FILTER (WHERE rp.estado IN ('abierto', 'en_revision'))::int AS reportes_abiertos,
         COALESCE(ROUND(
           100.0 * SUM(rt.aciertos)::numeric
           / NULLIF(SUM(rt.aciertos + rt.errores + rt.blancos), 0)
         ), 0)::int AS media_aciertos,
         MAX(t.fecha_fin) AS ultima_actividad
       FROM oposiciones o
       LEFT JOIN temas te ON te.oposicion_id = o.id
       LEFT JOIN preguntas p ON p.tema_id = te.id
       LEFT JOIN admin_tests at ON at.oposicion_id = o.id
       LEFT JOIN simulacros s ON s.oposicion_id = o.id
       LEFT JOIN accesos_oposicion ao ON ao.oposicion_id = o.id
        AND ao.estado = 'activo'
        AND (ao.fecha_fin IS NULL OR ao.fecha_fin > NOW())
       LEFT JOIN tests t ON t.oposicion_id = o.id AND t.estado = 'finalizado'
       LEFT JOIN resultados_test rt ON rt.test_id = t.id
       LEFT JOIN reportes_preguntas rp ON rp.pregunta_id = p.id
       WHERE ${assignedWhere}
       GROUP BY o.id
       ORDER BY o.nombre ASC`,
      [userId],
    );
    return result.rows;
  },

  async getDashboardKpis(userId, oposicionId = null) {
    const result = await pool.query(
      `WITH assigned AS (
         SELECT oposicion_id
         FROM profesores_oposiciones
         WHERE user_id = $1
           AND ($2::bigint IS NULL OR oposicion_id = $2)
       ),
       alumnos AS (
         SELECT COUNT(DISTINCT ao.usuario_id)::int AS total
         FROM accesos_oposicion ao
         JOIN assigned a ON a.oposicion_id = ao.oposicion_id
         WHERE ao.estado = 'activo'
           AND (ao.fecha_fin IS NULL OR ao.fecha_fin > NOW())
       ),
       tests_hoy AS (
         SELECT COUNT(*)::int AS total
         FROM tests t
         LEFT JOIN temas te ON te.id = t.tema_id
         JOIN assigned a ON a.oposicion_id = COALESCE(t.oposicion_id, te.oposicion_id)
         WHERE t.estado = 'finalizado'
           AND COALESCE(t.fecha_fin, t.fecha_creacion)::date = CURRENT_DATE
       ),
       media AS (
         SELECT COALESCE(ROUND(
           100.0 * SUM(rt.aciertos)::numeric
           / NULLIF(SUM(rt.aciertos + rt.errores + rt.blancos), 0)
         ), 0)::int AS total
         FROM tests t
         LEFT JOIN temas te ON te.id = t.tema_id
         JOIN assigned a ON a.oposicion_id = COALESCE(t.oposicion_id, te.oposicion_id)
         JOIN resultados_test rt ON rt.test_id = t.id
       ),
       simulacros AS (
         SELECT COUNT(*)::int AS total
         FROM tests t
         LEFT JOIN temas te ON te.id = t.tema_id
         JOIN assigned a ON a.oposicion_id = COALESCE(t.oposicion_id, te.oposicion_id)
         WHERE t.estado = 'finalizado' AND t.tipo_test = 'simulacro'
       ),
       reportes AS (
         SELECT COUNT(DISTINCT rp.id)::int AS total
         FROM reportes_preguntas rp
         JOIN preguntas p ON p.id = rp.pregunta_id
         JOIN temas te ON te.id = p.tema_id
         JOIN assigned a ON a.oposicion_id = te.oposicion_id
         WHERE rp.estado IN ('abierto', 'en_revision')
       )
       SELECT
         (SELECT total FROM alumnos) AS alumnos_activos,
         (SELECT total FROM tests_hoy) AS tests_realizados_hoy,
         (SELECT total FROM media) AS media_aciertos,
         (SELECT total FROM simulacros) AS simulacros_completados,
         (SELECT total FROM reportes) AS preguntas_pendientes_revision`,
      [userId, oposicionId],
    );
    return result.rows[0];
  },

  async getEvolucion(userId, oposicionId = null, days = 30) {
    const result = await pool.query(
      `WITH dias AS (
         SELECT generate_series(CURRENT_DATE - ($3::int - 1), CURRENT_DATE, INTERVAL '1 day')::date AS dia
       ),
       data AS (
         SELECT COALESCE(t.fecha_fin, t.fecha_creacion)::date AS dia,
                COUNT(*)::int AS actividad,
                COALESCE(ROUND(
                  100.0 * SUM(rt.aciertos)::numeric
                  / NULLIF(SUM(rt.aciertos + rt.errores + rt.blancos), 0)
                ), 0)::int AS aciertos,
                COALESCE(ROUND(AVG(rt.tiempo_segundos) / 60.0), 0)::int AS tiempo
         FROM tests t
         LEFT JOIN temas te ON te.id = t.tema_id
         JOIN resultados_test rt ON rt.test_id = t.id
         JOIN profesores_oposiciones po ON po.oposicion_id = COALESCE(t.oposicion_id, te.oposicion_id)
         WHERE po.user_id = $1
           AND ($2::bigint IS NULL OR COALESCE(t.oposicion_id, te.oposicion_id) = $2)
           AND COALESCE(t.fecha_fin, t.fecha_creacion) >= CURRENT_DATE - ($3::int - 1)
         GROUP BY COALESCE(t.fecha_fin, t.fecha_creacion)::date
       )
       SELECT to_char(d.dia, 'DD Mon') AS label,
              COALESCE(data.aciertos, 0)::int AS aciertos,
              COALESCE(data.tiempo, 0)::int AS tiempo,
              COALESCE(data.actividad, 0)::int AS actividad
       FROM dias d
       LEFT JOIN data ON data.dia = d.dia
       ORDER BY d.dia ASC`,
      [userId, oposicionId, days],
    );
    return result.rows;
  },

  async getActividadReciente(userId, limit = 10, oposicionId = null) {
    const result = await pool.query(
      `SELECT *
       FROM (
         SELECT 'reporte' AS tipo, rp.id, rp.fecha_creacion AS fecha,
                p.enunciado AS titulo, o.nombre AS oposicion_nombre
         FROM reportes_preguntas rp
         JOIN preguntas p ON p.id = rp.pregunta_id
         ${questionAssignedJoin}
         JOIN profesores_oposiciones po ON po.oposicion_id = o.id
         WHERE po.user_id = $1
            AND ($3::bigint IS NULL OR o.id = $3)
         UNION ALL
         SELECT 'sesion_test' AS tipo, t.id, COALESCE(t.fecha_fin, t.fecha_creacion) AS fecha,
                t.tipo_test AS titulo, o.nombre AS oposicion_nombre
         FROM tests t
         LEFT JOIN temas te ON te.id = t.tema_id
         JOIN oposiciones o ON o.id = COALESCE(t.oposicion_id, te.oposicion_id)
         JOIN profesores_oposiciones po ON po.oposicion_id = o.id
         WHERE po.user_id = $1
            AND ($3::bigint IS NULL OR o.id = $3)
       ) a
       ORDER BY fecha DESC
       LIMIT $2`,
      [userId, limit, oposicionId],
    );
    return result.rows;
  },

  async getTemario(userId, oposicionId = null) {
    const result = await pool.query(
      `SELECT
         te.id AS tema_id,
         te.nombre AS tema_nombre,
         o.id AS oposicion_id,
         o.nombre AS oposicion_nombre,
         o.slug AS oposicion_slug,
         COUNT(DISTINCT p.id)::int AS preguntas,
         COUNT(DISTINCT at.id)::int AS plantillas_test,
         COUNT(DISTINCT rp.id) FILTER (WHERE rp.estado IN ('abierto', 'en_revision'))::int AS reportes_abiertos,
         COALESCE(SUM(rt.aciertos), 0)::int AS aciertos,
         COALESCE(SUM(rt.errores), 0)::int AS errores,
         COALESCE(SUM(rt.blancos), 0)::int AS blancos,
         COALESCE(ROUND(
           100.0 * SUM(rt.aciertos)::numeric
           / NULLIF(SUM(rt.aciertos + rt.errores + rt.blancos), 0)
         ), 0)::int AS media_aciertos
       FROM temas te
       JOIN oposiciones o ON o.id = te.oposicion_id
       JOIN profesores_oposiciones po ON po.oposicion_id = o.id
       LEFT JOIN preguntas p ON p.tema_id = te.id
       LEFT JOIN admin_tests at ON at.tema_id = te.id OR at.oposicion_id = o.id
       LEFT JOIN tests_preguntas tp ON tp.pregunta_id = p.id
       LEFT JOIN tests ts ON ts.id = tp.test_id AND ts.estado = 'finalizado'
       LEFT JOIN resultados_test rt ON rt.test_id = ts.id
       LEFT JOIN reportes_preguntas rp ON rp.pregunta_id = p.id
       WHERE po.user_id = $1
         AND ($2::bigint IS NULL OR o.id = $2)
       GROUP BY te.id, o.id
       ORDER BY o.nombre ASC, te.nombre ASC`,
      [userId, oposicionId],
    );
    return result.rows;
  },

  async getOposicionIdBySlug(userId, slug) {
    const result = await pool.query(
      `SELECT o.id
       FROM oposiciones o
       JOIN profesores_oposiciones po ON po.oposicion_id = o.id
       WHERE po.user_id = $1 AND o.slug = $2
       LIMIT 1`,
      [userId, slug],
    );
    return result.rows[0] ?? null;
  },

  async getTemaDetalle(userId, temaId) {
    const [temaResult, preguntasResult, reportesResult] = await Promise.all([
      pool.query(
        `SELECT
           te.id AS tema_id,
           te.nombre AS tema_nombre,
           o.id AS oposicion_id,
           o.nombre AS oposicion_nombre,
           o.slug AS oposicion_slug,
           COUNT(DISTINCT p.id)::int AS preguntas,
           COUNT(DISTINCT rp.id) FILTER (WHERE rp.estado IN ('abierto','en_revision'))::int AS reportes_abiertos,
           COALESCE(SUM(rt.aciertos), 0)::int AS aciertos,
           COALESCE(SUM(rt.errores), 0)::int AS errores,
           COALESCE(SUM(rt.blancos), 0)::int AS blancos,
           COALESCE(ROUND(
             100.0 * SUM(rt.aciertos)::numeric
             / NULLIF(SUM(rt.aciertos + rt.errores + rt.blancos), 0)
           ), 0)::int AS media_aciertos
         FROM temas te
         JOIN oposiciones o ON o.id = te.oposicion_id
         JOIN profesores_oposiciones po ON po.oposicion_id = o.id
         LEFT JOIN preguntas p ON p.tema_id = te.id
         LEFT JOIN tests_preguntas tp ON tp.pregunta_id = p.id
         LEFT JOIN tests ts ON ts.id = tp.test_id AND ts.estado = 'finalizado'
         LEFT JOIN resultados_test rt ON rt.test_id = ts.id
         LEFT JOIN reportes_preguntas rp ON rp.pregunta_id = p.id
         WHERE po.user_id = $1 AND te.id = $2
         GROUP BY te.id, o.id`,
        [userId, temaId],
      ),
      pool.query(
        `SELECT
           p.id AS pregunta_id,
           LEFT(p.enunciado, 120) AS enunciado,
           COUNT(ru.id)::int AS veces_respondida,
           COUNT(ru.id) FILTER (WHERE ru.correcta = true)::int AS veces_correcta,
           COALESCE(ROUND(
             100.0 * COUNT(ru.id) FILTER (WHERE ru.correcta = true)::numeric
             / NULLIF(COUNT(ru.id), 0)
           ), 0)::int AS tasa_acierto
         FROM preguntas p
         LEFT JOIN respuestas_usuario ru ON ru.pregunta_id = p.id
         WHERE p.tema_id = $1
         GROUP BY p.id
         ORDER BY tasa_acierto ASC
         LIMIT 30`,
        [temaId],
      ),
      pool.query(
        `SELECT
           rp.id,
           rp.motivo,
           rp.estado,
           rp.fecha_creacion,
           LEFT(p.enunciado, 100) AS pregunta_enunciado,
           u.nombre AS alumno_nombre
         FROM reportes_preguntas rp
         JOIN preguntas p ON p.id = rp.pregunta_id
         LEFT JOIN usuarios u ON u.id = rp.usuario_id
         WHERE p.tema_id = $1
           AND rp.estado IN ('abierto','en_revision')
         ORDER BY rp.fecha_creacion DESC
         LIMIT 15`,
        [temaId],
      ),
    ]);
    return {
      tema: temaResult.rows[0] ?? null,
      preguntas: preguntasResult.rows,
      reportes: reportesResult.rows,
    };
  },

  async getSimulacrosActivos(userId, oposicionId, limit = 5) {
    const result = await pool.query(
      `SELECT
         s.id,
         s.nombre,
         s.estado,
         s.fecha_publicacion,
         s.tiempo_limite_segundos,
         COUNT(DISTINCT sb.id)::int AS total_secciones,
         COALESCE(SUM(sb.numero_preguntas), 0)::int AS total_preguntas,
         0::int AS participantes,
         0::int AS media_aciertos
       FROM simulacros s
       JOIN oposiciones o ON o.id = s.oposicion_id
       JOIN profesores_oposiciones po ON po.oposicion_id = o.id
       LEFT JOIN simulacros_bloques sb ON sb.simulacro_id = s.id
       WHERE po.user_id = $1
         AND s.oposicion_id = $2
         AND s.estado IN ('publicado', 'borrador')
       GROUP BY s.id
       ORDER BY
         CASE WHEN s.estado = 'publicado' THEN 0 ELSE 1 END,
         s.fecha_publicacion DESC NULLS LAST,
         s.fecha_creacion DESC
       LIMIT $3`,
      [userId, oposicionId, limit],
    );
    return result.rows;
  },

  async listAlumnos(userId, { oposicionId = null, q = null, limit, offset }) {
    const args = [userId, oposicionId, q ? `%${q}%` : null, limit, offset];
    const rows = await pool.query(
      `SELECT
         u.id,
         u.nombre,
         u.email,
         MAX(COALESCE(t.fecha_fin, t.fecha_creacion)) AS ultima_actividad,
         COUNT(DISTINCT t.id) FILTER (WHERE t.estado = 'finalizado')::int AS tests_realizados,
         COUNT(DISTINCT t.id) FILTER (WHERE t.estado = 'finalizado' AND t.tipo_test = 'simulacro')::int AS simulacros_realizados,
         COALESCE(ROUND(
           100.0 * SUM(rt.aciertos)::numeric
           / NULLIF(SUM(rt.aciertos + rt.errores + rt.blancos), 0)
         ), 0)::int AS media_aciertos,
         COALESCE(
           json_agg(DISTINCT jsonb_build_object('id', o.id, 'nombre', o.nombre))
           FILTER (WHERE o.id IS NOT NULL),
           '[]'
         ) AS oposiciones
       FROM usuarios u
       JOIN accesos_oposicion ao ON ao.usuario_id = u.id
       JOIN oposiciones o ON o.id = ao.oposicion_id
       JOIN profesores_oposiciones po ON po.oposicion_id = o.id
       LEFT JOIN tests t ON t.usuario_id = u.id AND t.oposicion_id = o.id
       LEFT JOIN resultados_test rt ON rt.test_id = t.id
       WHERE po.user_id = $1
         AND ao.estado = 'activo'
         AND (ao.fecha_fin IS NULL OR ao.fecha_fin > NOW())
         AND ($2::bigint IS NULL OR o.id = $2)
         AND ($3::text IS NULL OR u.nombre ILIKE $3 OR u.email ILIKE $3)
       GROUP BY u.id
       ORDER BY ultima_actividad DESC NULLS LAST, u.nombre ASC
       LIMIT $4 OFFSET $5`,
      args,
    );
    const count = await pool.query(
      `SELECT COUNT(DISTINCT u.id)::int AS total
       FROM usuarios u
       JOIN accesos_oposicion ao ON ao.usuario_id = u.id
       JOIN oposiciones o ON o.id = ao.oposicion_id
       JOIN profesores_oposiciones po ON po.oposicion_id = o.id
       WHERE po.user_id = $1
         AND ao.estado = 'activo'
         AND (ao.fecha_fin IS NULL OR ao.fecha_fin > NOW())
         AND ($2::bigint IS NULL OR o.id = $2)
         AND ($3::text IS NULL OR u.nombre ILIKE $3 OR u.email ILIKE $3)`,
      [userId, oposicionId, q ? `%${q}%` : null],
    );
    return { items: rows.rows, total: count.rows[0].total };
  },

  async getAlumnoDetalle(userId, alumnoId, oposicionId = null) {
    const result = await pool.query(
      `SELECT
         u.id, u.nombre, u.email,
         COUNT(DISTINCT t.id) FILTER (WHERE t.estado = 'finalizado')::int AS tests_realizados,
         COUNT(DISTINCT t.id) FILTER (WHERE t.estado = 'finalizado' AND t.tipo_test = 'simulacro')::int AS simulacros_realizados,
         COALESCE(ROUND(
           100.0 * SUM(rt.aciertos)::numeric
           / NULLIF(SUM(rt.aciertos + rt.errores + rt.blancos), 0)
         ), 0)::int AS media_aciertos,
         MAX(COALESCE(t.fecha_fin, t.fecha_creacion)) AS ultima_actividad
       FROM usuarios u
       JOIN accesos_oposicion ao ON ao.usuario_id = u.id
       JOIN profesores_oposiciones po ON po.oposicion_id = ao.oposicion_id
       LEFT JOIN tests t ON t.usuario_id = u.id AND t.oposicion_id = ao.oposicion_id
       LEFT JOIN resultados_test rt ON rt.test_id = t.id
       WHERE po.user_id = $1
         AND u.id = $2
         AND ao.estado = 'activo'
         AND (ao.fecha_fin IS NULL OR ao.fecha_fin > NOW())
         AND ($3::bigint IS NULL OR ao.oposicion_id = $3)
       GROUP BY u.id`,
      [userId, alumnoId, oposicionId],
    );
    return result.rows[0] ?? null;
  },

  async getAlumnoProgresoPorTema(userId, alumnoId, oposicionId = null) {
    const result = await pool.query(
      `SELECT
         te.id AS tema_id,
         te.nombre AS tema_nombre,
         o.id AS oposicion_id,
         o.nombre AS oposicion_nombre,
         COUNT(DISTINCT p.id)::int AS total_preguntas,
         COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NOT NULL)::int AS intentos,
         COUNT(ru.id) FILTER (WHERE ru.correcta = true)::int AS aciertos,
         COALESCE(ROUND(
           100.0 * COUNT(ru.id) FILTER (WHERE ru.correcta = true)::numeric
           / NULLIF(COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NOT NULL), 0)
         , 1), 0) AS porcentaje_acierto
       FROM temas te
       JOIN oposiciones o ON o.id = te.oposicion_id
       JOIN profesores_oposiciones po ON po.oposicion_id = o.id
       LEFT JOIN preguntas p ON p.tema_id = te.id
       LEFT JOIN respuestas_usuario ru ON ru.pregunta_id = p.id
         AND EXISTS (
           SELECT 1 FROM tests ts
           WHERE ts.id = ru.test_id
             AND ts.usuario_id = $2
             AND ts.estado = 'finalizado'
         )
       WHERE po.user_id = $1
         AND ($3::bigint IS NULL OR o.id = $3)
       GROUP BY te.id, te.nombre, o.id, o.nombre
       ORDER BY o.nombre ASC, te.nombre ASC`,
      [userId, alumnoId, oposicionId],
    );
    return result.rows.map((row) => ({
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      oposicionId: Number(row.oposicion_id),
      oposicionNombre: row.oposicion_nombre,
      totalPreguntas: Number(row.total_preguntas ?? 0),
      intentos: Number(row.intentos ?? 0),
      aciertos: Number(row.aciertos ?? 0),
      porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
    }));
  },

  async getAlumnoUltimosTests(userId, alumnoId, oposicionId = null, limit = 10) {
    const result = await pool.query(
      `SELECT
         t.id,
         t.tipo_test,
         COALESCE(t.fecha_fin, t.fecha_creacion) AS fecha,
         o.nombre AS oposicion_nombre,
         rt.aciertos,
         rt.errores,
         rt.blancos,
         rt.nota,
         rt.tiempo_segundos,
         (rt.aciertos + rt.errores + rt.blancos) AS total_preguntas
       FROM tests t
       JOIN oposiciones o ON o.id = t.oposicion_id
       JOIN profesores_oposiciones po ON po.oposicion_id = o.id
       LEFT JOIN resultados_test rt ON rt.test_id = t.id
       WHERE po.user_id = $1
         AND t.usuario_id = $2
         AND t.estado = 'finalizado'
         AND ($3::bigint IS NULL OR t.oposicion_id = $3)
       ORDER BY COALESCE(t.fecha_fin, t.fecha_creacion) DESC
       LIMIT $4`,
      [userId, alumnoId, oposicionId, limit],
    );
    return result.rows.map((row) => ({
      id: Number(row.id),
      tipoTest: row.tipo_test,
      fecha: row.fecha,
      oposicionNombre: row.oposicion_nombre,
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      blancos: Number(row.blancos ?? 0),
      totalPreguntas: Number(row.total_preguntas ?? 0),
      nota: row.nota != null ? Number(row.nota) : null,
      tiempoSegundos: row.tiempo_segundos != null ? Number(row.tiempo_segundos) : null,
    }));
  },

  async getPreguntasProblematicas(userId, { oposicionId = null, temaId = null, limit, offset }) {
    const result = await pool.query(
      `WITH stats AS (
         SELECT
           p.id,
           p.enunciado,
           p.nivel_dificultad,
           te.id AS tema_id,
           te.nombre AS tema_nombre,
           o.id AS oposicion_id,
           o.nombre AS oposicion_nombre,
           COUNT(ru.id)::int AS intentos,
           COUNT(ru.id) FILTER (WHERE ru.correcta = false)::int AS fallos,
           COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NULL)::int AS blancos,
           COUNT(DISTINCT rp.id) FILTER (WHERE rp.estado IN ('abierto', 'en_revision'))::int AS reportes
         FROM preguntas p
         ${questionAssignedJoin}
         JOIN profesores_oposiciones po ON po.oposicion_id = o.id
         LEFT JOIN respuestas_usuario ru ON ru.pregunta_id = p.id
         LEFT JOIN reportes_preguntas rp ON rp.pregunta_id = p.id
         WHERE po.user_id = $1
           AND ($2::bigint IS NULL OR o.id = $2)
           AND ($3::bigint IS NULL OR te.id = $3)
         GROUP BY p.id, te.id, o.id
       )
       SELECT *,
              CASE WHEN intentos > 0 THEN ROUND(100.0 * fallos / intentos)::int ELSE 0 END AS tasa_fallo,
              CASE WHEN intentos > 0 THEN ROUND(100.0 * blancos / intentos)::int ELSE 0 END AS tasa_blancos
       FROM stats
       WHERE reportes > 0
          OR (intentos >= 5 AND (100.0 * fallos / NULLIF(intentos, 0)) >= 60)
          OR (intentos >= 5 AND (100.0 * blancos / NULLIF(intentos, 0)) >= 30)
       ORDER BY reportes DESC, tasa_fallo DESC, intentos DESC
       LIMIT $4 OFFSET $5`,
      [userId, oposicionId, temaId, limit, offset],
    );
    return result.rows;
  },

  async getActividadFeed(userId, { tipo = null, oposicionId = null, alumnoId = null, fechaDesde = null, fechaHasta = null, limit = 20, offset = 0 }) {
    const result = await pool.query(
      `WITH feed AS (
         SELECT
           'reporte'::text AS tipo,
           rp.id::bigint,
           rp.fecha_creacion AS fecha,
           p.enunciado AS titulo,
           o.nombre AS oposicion_nombre,
           o.id::bigint AS oposicion_id,
           rp.estado,
           u_rep.nombre AS alumno_nombre,
           rp.usuario_id::bigint AS alumno_id,
           NULL::int AS aciertos,
           NULL::int AS errores,
           NULL::numeric AS nota
         FROM reportes_preguntas rp
         JOIN preguntas p ON p.id = rp.pregunta_id
         JOIN temas te ON te.id = p.tema_id
         JOIN oposiciones o ON o.id = te.oposicion_id
         JOIN profesores_oposiciones po ON po.oposicion_id = o.id
         LEFT JOIN usuarios u_rep ON u_rep.id = rp.usuario_id
         WHERE po.user_id = $1
           AND ($4::bigint IS NULL OR o.id = $4)
         UNION ALL
         SELECT
           'sesion_test'::text AS tipo,
           t.id::bigint,
           COALESCE(t.fecha_fin, t.fecha_creacion) AS fecha,
           t.tipo_test AS titulo,
           o.nombre AS oposicion_nombre,
           o.id::bigint AS oposicion_id,
           NULL::text AS estado,
           u.nombre AS alumno_nombre,
           t.usuario_id::bigint AS alumno_id,
           COALESCE(rt.aciertos, 0)::int AS aciertos,
           COALESCE(rt.errores, 0)::int AS errores,
           rt.nota
         FROM tests t
         LEFT JOIN temas te ON te.id = t.tema_id
         JOIN oposiciones o ON o.id = COALESCE(t.oposicion_id, te.oposicion_id)
         JOIN profesores_oposiciones po ON po.oposicion_id = o.id
         JOIN usuarios u ON u.id = t.usuario_id
         LEFT JOIN resultados_test rt ON rt.test_id = t.id
         WHERE po.user_id = $1
           AND t.estado = 'finalizado'
           AND ($4::bigint IS NULL OR o.id = $4)
       )
       SELECT *, COUNT(*) OVER()::int AS total
       FROM feed
       WHERE ($5::text IS NULL OR tipo = $5)
         AND ($6::bigint IS NULL OR alumno_id = $6)
         AND ($7::timestamptz IS NULL OR fecha >= $7)
         AND ($8::timestamptz IS NULL OR fecha <= $8)
       ORDER BY fecha DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset, oposicionId, tipo, alumnoId, fechaDesde, fechaHasta],
    );
    return result.rows;
  },

  async getDistribucionDificultad(userId, oposicionId = null) {
    const result = await pool.query(
      `SELECT p.nivel_dificultad, COUNT(DISTINCT p.id)::int AS total
       FROM preguntas p
       ${questionAssignedJoin}
       JOIN profesores_oposiciones po ON po.oposicion_id = o.id
       WHERE po.user_id = $1
         AND ($2::bigint IS NULL OR o.id = $2)
       GROUP BY p.nivel_dificultad
       ORDER BY p.nivel_dificultad`,
      [userId, oposicionId],
    );
    return result.rows;
  },
};
