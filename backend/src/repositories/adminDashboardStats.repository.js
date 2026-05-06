import pool from '../config/db.js';

export const adminDashboardStatsRepository = {
  async getAdminStats() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM preguntas)                                      AS total_preguntas,
        (SELECT COUNT(*)::int FROM usuarios WHERE deleted_at IS NULL)              AS total_usuarios,
        (SELECT COUNT(*)::int FROM tests WHERE estado = 'finalizado')              AS total_tests,
        (SELECT COUNT(*)::int FROM tests
          WHERE estado = 'finalizado'
            AND fecha_creacion >= NOW() - INTERVAL '7 days')                      AS tests_esta_semana,
        (SELECT ROUND(AVG(rt.nota)::numeric, 2)
          FROM tests t JOIN resultados_test rt ON rt.test_id = t.id
          WHERE t.estado = 'finalizado')                                           AS nota_media_global
    `);
    const row = result.rows[0];
    return {
      totalPreguntas: row.total_preguntas,
      totalUsuarios: row.total_usuarios,
      totalTests: row.total_tests,
      testsEstaSemana: row.tests_esta_semana,
      notaMediaGlobal: row.nota_media_global !== null ? Number(row.nota_media_global) : null,
    };
  },

  // B6 — KPIs ampliados para el Dashboard admin (imagen briefing)
  async getAdminStatsFull() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM preguntas)                                        AS total_preguntas,
        (SELECT COUNT(*)::int FROM usuarios WHERE deleted_at IS NULL)                AS total_usuarios,
        (SELECT COUNT(*)::int
           FROM usuarios
           WHERE deleted_at IS NULL
             AND fecha_registro >= NOW() - INTERVAL '30 days')                      AS usuarios_activos_30d,
        (SELECT COUNT(*)::int FROM tests WHERE estado = 'finalizado')                AS total_tests,
        (SELECT COUNT(*)::int FROM tests
           WHERE estado = 'finalizado'
             AND fecha_creacion >= NOW() - INTERVAL '7 days')                       AS tests_esta_semana,
        (SELECT COUNT(*)::int FROM simulacros WHERE estado = 'publicado')            AS simulacros_publicados,
        (SELECT ROUND(AVG(rt.nota)::numeric, 2)
           FROM tests t JOIN resultados_test rt ON rt.test_id = t.id
           WHERE t.estado = 'finalizado')                                           AS nota_media_global,
        (SELECT COUNT(*)::int FROM oposiciones WHERE estado = 'activa')              AS oposiciones_activas,
        (SELECT COUNT(*)::int FROM etiquetas)                                        AS total_etiquetas
    `);
    const row = result.rows[0];
    return {
      totalPreguntas:       row.total_preguntas,
      totalUsuarios:        row.total_usuarios,
      usuariosActivos30d:   row.usuarios_activos_30d,
      totalTests:           row.total_tests,
      testsEstaSemana:      row.tests_esta_semana,
      simulacrosPublicados: row.simulacros_publicados,
      notaMediaGlobal:      row.nota_media_global !== null ? Number(row.nota_media_global) : null,
      oposicionesActivas:   row.oposiciones_activas,
      totalEtiquetas:       row.total_etiquetas,
    };
  },

  // B6 — Distribución de contenido (gráfico circular del Dashboard)
  async getDistribucionContenido() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM preguntas)   AS preguntas,
        (SELECT COUNT(*)::int FROM tests)       AS tests,
        (SELECT COUNT(*)::int FROM simulacros)  AS simulacros,
        (SELECT COUNT(*)::int FROM temas)       AS temas,
        (SELECT COUNT(*)::int FROM bloques)      AS bloques
    `);
    return result.rows[0];
  },

  // B6 — Top oposiciones por actividad (nº tests realizados últimos 30 días)
  async getTopOposiciones(limit = 5) {
    const result = await pool.query(
      `SELECT
         o.id, o.nombre, o.estado,
         COUNT(t.id)::int AS total_tests_30d
       FROM oposiciones o
       LEFT JOIN tests t ON t.oposicion_id = o.id
         AND t.estado = 'finalizado'
         AND t.fecha_creacion >= NOW() - INTERVAL '30 days'
       GROUP BY o.id
       ORDER BY total_tests_30d DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows;
  },

  // B6 — Evolución de usuarios registrados por día (últimos N días)
  async getEvolucionUsuarios(dias = 30) {
    const result = await pool.query(
      `SELECT
         DATE(fecha_registro)::text AS fecha,
         COUNT(*)::int              AS nuevos_usuarios
       FROM usuarios
       WHERE deleted_at IS NULL
         AND fecha_registro >= NOW() - ($1 || ' days')::interval
       GROUP BY DATE(fecha_registro)
       ORDER BY fecha`,
      [dias],
    );
    return result.rows;
  },

  // B5 — Log de actividad reciente (tabla actividad_global)
  async getActividadReciente(limit = 20) {
    const result = await pool.query(
      `SELECT
         ag.id, ag.tipo, ag.descripcion,
         ag.entidad, ag.entidad_id, ag.fecha,
         u.nombre AS usuario_nombre, u.email AS usuario_email
       FROM actividad_global ag
       LEFT JOIN usuarios u ON u.id = ag.usuario_id
       ORDER BY ag.fecha DESC, ag.id DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows;
  },

  // B5 — Insertar evento de actividad (llamado desde otros servicios)
  async insertActividad({ tipo, descripcion, usuarioId, entidad, entidadId }) {
    await pool.query(
      `INSERT INTO actividad_global (tipo, descripcion, usuario_id, entidad, entidad_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [tipo, descripcion, usuarioId ?? null, entidad ?? null, entidadId ?? null],
    );
  },

  async getBloquesConMasErrores(limit) {
    const result = await pool.query(
      `SELECT
         bl.id           AS bloque_id,
         bl.nombre       AS bloque_nombre,
         t.nombre        AS tema_nombre,
         COUNT(*)::int   AS total_respuestas,
         SUM(CASE WHEN ru.correcta = false THEN 1 ELSE 0 END)::int  AS total_errores,
         ROUND(
           SUM(CASE WHEN ru.correcta = false THEN 1 ELSE 0 END)::numeric
           / NULLIF(COUNT(*), 0) * 100, 1
         ) AS pct_error
       FROM respuestas_usuario ru
       JOIN preguntas p  ON p.id = ru.pregunta_id
       JOIN bloques bl   ON bl.id = p.bloque_id
       JOIN temas t      ON t.id  = bl.tema_id
       WHERE ru.correcta IS NOT NULL
       GROUP BY bl.id, bl.nombre, t.nombre
       HAVING COUNT(*) >= 10
       ORDER BY total_errores DESC
       LIMIT $1`,
      [limit],
    );
    return result.rows.map((r) => ({
      bloqueId: r.bloque_id,
      bloqueNombre: r.bloque_nombre,
      temaNombre: r.tema_nombre,
      totalRespuestas: r.total_respuestas,
      totalErrores: r.total_errores,
      pctError: r.pct_error !== null ? Number(r.pct_error) : null,
    }));
  },
};
