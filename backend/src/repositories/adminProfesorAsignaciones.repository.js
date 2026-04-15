import pool from '../config/db.js';

export const adminProfesorAsignacionesRepository = {
  /**
   * Devuelve las oposiciones asignadas a un profesor dado su userId.
   * Incluye nombre de la oposición para mostrar en el panel.
   */
  async listByUserId(userId) {
    const result = await pool.query(
      `SELECT po.id, po.oposicion_id, o.nombre AS oposicion_nombre, po.creado_en
       FROM profesores_oposiciones po
       JOIN oposiciones o ON o.id = po.oposicion_id
       WHERE po.user_id = $1
       ORDER BY o.nombre ASC`,
      [userId],
    );
    return result.rows;
  },

  /**
   * Asigna una oposición a un profesor (ignora si ya existe — ON CONFLICT DO NOTHING).
   * Devuelve la fila creada o null si ya existía.
   */
  async assign(userId, oposicionId) {
    const result = await pool.query(
      `INSERT INTO profesores_oposiciones (user_id, oposicion_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, oposicion_id) DO NOTHING
       RETURNING id, user_id, oposicion_id, creado_en`,
      [userId, oposicionId],
    );
    return result.rows[0] ?? null;
  },

  /**
   * Quita una oposición asignada a un profesor.
   * Devuelve true si se eliminó, false si no existía.
   */
  async remove(userId, oposicionId) {
    const result = await pool.query(
      `DELETE FROM profesores_oposiciones
       WHERE user_id = $1 AND oposicion_id = $2`,
      [userId, oposicionId],
    );
    return result.rowCount > 0;
  },
};
