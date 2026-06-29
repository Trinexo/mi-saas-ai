import pool from '../config/db.js';

export const testRecomendadoRepository = {
  /**
   * Devuelve el nombre de una oposición por su id.
   */
  async getNombreOposicion(oposicionId) {
    if (!oposicionId) return null;
    const result = await pool.query(
      `SELECT nombre FROM oposiciones WHERE id = $1`,
      [oposicionId],
    );
    return result.rows[0]?.nombre ?? null;
  },

  /**
   * Número de preguntas pendientes de repaso (repetición espaciada) del usuario.
   */
  async contarRepasoPendiente(userId) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM repeticion_espaciada
       WHERE usuario_id = $1 AND proxima_revision <= NOW()`,
      [userId],
    );
    return result.rows[0]?.total ?? 0;
  },

  /**
   * Tema con más preguntas pendientes de repaso del usuario.
   * Devuelve { temaId, temaNombre, pendientes } o null si no hay repaso pendiente.
   */
  async bloqueConMasRepasoPendiente(userId, oposicionId = null) {
    const params = [userId];
    const oposicionFilter = oposicionId ? 'AND t.oposicion_id = $2' : '';
    if (oposicionId) params.push(oposicionId);

    const result = await pool.query(
      `SELECT p.bloque_id, bl.nombre AS bloque_nombre, COUNT(*)::int AS pendientes
       FROM repeticion_espaciada re
       JOIN preguntas p ON p.id = re.pregunta_id
       JOIN bloques bl ON bl.id = p.bloque_id
       JOIN temas t ON t.id = bl.tema_id
       WHERE re.usuario_id = $1 AND re.proxima_revision <= NOW()
       ${oposicionFilter}
       GROUP BY p.bloque_id, bl.nombre
       ORDER BY pendientes DESC
       LIMIT 1`,
      params,
    );
    if (!result.rowCount) return null;
    const row = result.rows[0];
    return {
      bloqueId: Number(row.bloque_id),
      bloqueNombre: row.bloque_nombre,
      pendientes: Number(row.pendientes),
    };
  },

  /**
   * Tema con mayor tasa de error reciente del usuario dentro de su oposición preferida.
   * Devuelve { temaId, temaNombre, tasaError } o null si no hay datos.
   */
  async bloqueConMasErrores(userId, oposicionId, excludeIds = []) {
    const params = [userId];
    let pidx = 2;
    const oposicionFilter = oposicionId ? `AND o.id = $${pidx++}` : '';
    if (oposicionId) params.push(oposicionId);
    const excludeFilter = excludeIds.length > 0 ? `AND p.bloque_id != ALL($${pidx++}::bigint[])` : '';
    if (excludeIds.length > 0) params.push(excludeIds);

    const result = await pool.query(
      `SELECT p.bloque_id,
              bl.nombre AS bloque_nombre,
              SUM(pu.errores)::int     AS errores,
              SUM(pu.preguntas_vistas)::int AS vistas,
              CASE WHEN SUM(pu.preguntas_vistas) > 0
                   THEN ROUND(SUM(pu.errores)::numeric / SUM(pu.preguntas_vistas) * 100, 1)
                   ELSE 0
              END AS tasa_error
       FROM progreso_usuario pu
       JOIN bloques bl ON bl.id = pu.bloque_id
       JOIN temas t ON t.id = bl.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       JOIN preguntas p ON p.bloque_id = pu.bloque_id
       WHERE pu.usuario_id = $1
         AND pu.preguntas_vistas >= 5
         ${oposicionFilter}
         ${excludeFilter}
       GROUP BY p.bloque_id, bl.nombre
       ORDER BY tasa_error DESC
       LIMIT 1`,
      params,
    );

    if (!result.rowCount) return null;
    const row = result.rows[0];
    return {
      bloqueId: Number(row.bloque_id),
      bloqueNombre: row.bloque_nombre,
      tasaError: Number(row.tasa_error),
    };
  },

  /**
   * Tema con menos preguntas vistas (ideal para práctica normal cuando el usuario
   * lleva poco tiempo o quiere expandir su conocimiento).
   */
  async bloqueConMenosVistas(userId, oposicionId, excludeIds = []) {
    const params = [userId];
    let pidx = 2;
    const oposicionFilter = oposicionId ? `AND o.id = $${pidx++}` : '';
    if (oposicionId) params.push(oposicionId);
    const excludeFilter = excludeIds.length > 0 ? `AND bl.id != ALL($${pidx++}::bigint[])` : '';
    if (excludeIds.length > 0) params.push(excludeIds);

    const result = await pool.query(
      `SELECT bl.id AS bloque_id, bl.nombre AS bloque_nombre,
              COALESCE(pu.preguntas_vistas, 0) AS vistas
       FROM colecciones bl
       JOIN temas t ON t.id = bl.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       LEFT JOIN progreso_usuario pu ON pu.bloque_id = bl.id AND pu.usuario_id = $1
       WHERE TRUE ${oposicionFilter} ${excludeFilter}
       ORDER BY vistas ASC, RANDOM()
       LIMIT 1`,
      params,
    );

    if (!result.rowCount) return null;
    const row = result.rows[0];
    return { bloqueId: Number(row.bloque_id), bloqueNombre: row.bloque_nombre };
  },

  /**
   * Devuelve el número de tests realizados por el usuario (para detectar nuevos usuarios).
   */
  async contarTests(userId, oposicionId = null, modoPreparacion = 'experto') {
    const params = [userId, modoPreparacion];
    const oposicionFilter = oposicionId ? 'AND oposicion_id = $3' : '';
    if (oposicionId) params.push(oposicionId);

    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM tests
       WHERE usuario_id = $1
         AND modo_preparacion = $2
         ${oposicionFilter}`,
      params,
    );
    return result.rows[0]?.total ?? 0;
  },

  /**
   * Devuelve los tema_id de tests finalizados en las últimas N horas.
   * Se usa para evitar recomendar el mismo tema practicado recientemente.
   */
  async bloquesRecientesPracticados(userId, horasAtras = 24, oposicionId = null, modoPreparacion = 'experto') {
    const params = [userId, horasAtras, modoPreparacion];
    const oposicionFilter = oposicionId ? 'AND te.oposicion_id = $4' : '';
    if (oposicionId) params.push(oposicionId);

    const result = await pool.query(
      `SELECT DISTINCT p.bloque_id::int
       FROM tests ts
       JOIN tests_preguntas tp ON tp.test_id = ts.id
       JOIN preguntas p ON p.id = tp.pregunta_id
       JOIN bloques bl ON bl.id = p.bloque_id
       JOIN temas te ON te.id = bl.tema_id
       WHERE ts.usuario_id = $1
         AND ts.estado = 'finalizado'
         AND ts.fecha_creacion >= NOW() - ($2 || ' hours')::interval
         AND ts.modo_preparacion = $3
         ${oposicionFilter}
         AND p.bloque_id IS NOT NULL`,
      params,
    );
    return result.rows.map((r) => Number(r.bloque_id));
  },
};
