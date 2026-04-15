import pool from '../config/db.js';

export const testRecomendadoRepository = {
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
   * Tema con mayor tasa de error reciente del usuario dentro de su oposición preferida.
   * Devuelve { temaId, temaNombre, tasaError } o null si no hay datos.
   */
  async temaConMasErrores(userId, oposicionId) {
    const params = [userId];
    const oposicionFilter = oposicionId
      ? 'AND o.id = $2'
      : '';
    if (oposicionId) params.push(oposicionId);

    const result = await pool.query(
      `SELECT p.tema_id,
              t.nombre AS tema_nombre,
              SUM(pu.errores)::int     AS errores,
              SUM(pu.preguntas_vistas)::int AS vistas,
              CASE WHEN SUM(pu.preguntas_vistas) > 0
                   THEN ROUND(SUM(pu.errores)::numeric / SUM(pu.preguntas_vistas) * 100, 1)
                   ELSE 0
              END AS tasa_error
       FROM progreso_usuario pu
       JOIN temas t ON t.id = pu.tema_id
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       JOIN preguntas p ON p.tema_id = pu.tema_id
       WHERE pu.usuario_id = $1
         AND pu.preguntas_vistas >= 5
         ${oposicionFilter}
       GROUP BY p.tema_id, t.nombre
       ORDER BY tasa_error DESC
       LIMIT 1`,
      params,
    );

    if (!result.rowCount) return null;
    const row = result.rows[0];
    return {
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      tasaError: Number(row.tasa_error),
    };
  },

  /**
   * Tema con menos preguntas vistas (ideal para práctica normal cuando el usuario
   * lleva poco tiempo o quiere expandir su conocimiento).
   */
  async temaConMenosVistas(userId, oposicionId) {
    const params = [userId];
    const oposicionFilter = oposicionId ? 'AND o.id = $2' : '';
    if (oposicionId) params.push(oposicionId);

    const result = await pool.query(
      `SELECT t.id AS tema_id, t.nombre AS tema_nombre,
              COALESCE(pu.preguntas_vistas, 0) AS vistas
       FROM temas t
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       LEFT JOIN progreso_usuario pu ON pu.tema_id = t.id AND pu.usuario_id = $1
       WHERE TRUE ${oposicionFilter}
       ORDER BY vistas ASC, t.id ASC
       LIMIT 1`,
      params,
    );

    if (!result.rowCount) return null;
    const row = result.rows[0];
    return { temaId: Number(row.tema_id), temaNombre: row.tema_nombre };
  },

  /**
   * Devuelve el número de tests realizados por el usuario (para detectar nuevos usuarios).
   */
  async contarTests(userId) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS total FROM tests WHERE usuario_id = $1`,
      [userId],
    );
    return result.rows[0]?.total ?? 0;
  },
};
