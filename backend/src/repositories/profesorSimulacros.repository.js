import pool from '../config/db.js';

// Los tests del profesor son los simulacros y tests de práctica asociados
// a las oposiciones que tiene asignadas. No gestiona tests de alumnos,
// solo puede crear/editar/eliminar sus propias plantillas de simulacros.

export const profesorSimulacrosRepository = {
  // ─── Tests de práctica propios ───────────────────────────────────────────────
  // El profesor consulta los tests (sesiones) que él mismo generó para revisar
  // el comportamiento de preguntas propias.
  async getMisTests(userId, { oposicionId, q, limit, offset }) {
    const args = [userId];
    const conds = ['t.usuario_id = $1'];

    if (oposicionId) { args.push(oposicionId); conds.push(`t.oposicion_id = $${args.length}`); }
    if (q)           { args.push(`%${q}%`);    conds.push(`t.tipo_test ILIKE $${args.length}`); }

    const where = conds.join(' AND ');
    args.push(limit, offset);

    const rows = await pool.query(
      `SELECT t.id, t.tipo_test, t.numero_preguntas, t.estado,
              t.fecha_creacion, t.duracion_segundos,
              o.nombre AS oposicion_nombre,
              rt.nota, rt.aciertos, rt.errores, rt.blancos
       FROM tests t
       LEFT JOIN oposiciones o ON o.id = t.oposicion_id
       LEFT JOIN resultados_test rt ON rt.test_id = t.id
       WHERE ${where}
       ORDER BY t.fecha_creacion DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );
    const countArgs = args.slice(0, args.length - 2);
    const countRow = await pool.query(
      `SELECT COUNT(*)::int AS total FROM tests t WHERE ${where}`,
      countArgs,
    );
    return { items: rows.rows, total: countRow.rows[0].total };
  },

  // ─── Simulacros propios ───────────────────────────────────────────────────────
  // El profesor puede crear/editar simulacros limitados a sus oposiciones asignadas.
  async getMisSimulacros(userId, { oposicionId, estado, q, limit, offset }) {
    const args = [userId];
    const conds = ['s.creado_por = $1'];

    if (oposicionId) { args.push(oposicionId);    conds.push(`s.oposicion_id = $${args.length}`); }
    if (estado)      { args.push(estado);          conds.push(`s.estado = $${args.length}`); }
    if (q)           { args.push(`%${q}%`);        conds.push(`s.nombre ILIKE $${args.length}`); }

    const where = conds.join(' AND ');
    args.push(limit, offset);

    const rows = await pool.query(
      `SELECT s.id, s.nombre, s.descripcion, s.estado,
              s.tiempo_limite_segundos, s.puntuacion_maxima,
              s.fecha_publicacion, s.fecha_creacion,
              o.nombre AS oposicion_nombre, s.oposicion_id,
              COUNT(DISTINCT sb.id)::int             AS total_bloques,
              COALESCE(SUM(sb.numero_preguntas), 0)::int AS total_preguntas
       FROM simulacros s
       LEFT JOIN oposiciones o      ON o.id = s.oposicion_id
       LEFT JOIN simulacros_bloques sb ON sb.simulacro_id = s.id
       WHERE ${where}
       GROUP BY s.id, o.nombre
       ORDER BY s.fecha_creacion DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args,
    );
    const countArgs = args.slice(0, args.length - 2);
    const countRow = await pool.query(
      `SELECT COUNT(*)::int AS total FROM simulacros s WHERE ${where}`,
      countArgs,
    );
    return { items: rows.rows, total: countRow.rows[0].total };
  },

  // Verificar que la oposición está asignada al profesor
  async oposicionAsignada(userId, oposicionId) {
    const r = await pool.query(
      `SELECT 1 FROM profesores_oposiciones WHERE user_id = $1 AND oposicion_id = $2`,
      [userId, oposicionId],
    );
    return r.rows.length > 0;
  },

  // Verificar que el simulacro pertenece al profesor
  async simulacroEsPropio(userId, simulacroId) {
    const r = await pool.query(
      `SELECT 1 FROM simulacros WHERE id = $1 AND creado_por = $2`,
      [simulacroId, userId],
    );
    return r.rows.length > 0;
  },
};
