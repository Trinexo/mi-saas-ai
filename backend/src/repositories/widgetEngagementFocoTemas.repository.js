import pool from '../config/db.js';

export const widgetEngagementFocoTemasRepository = {
  async getTemasDebiles(userId) {
    const result = await pool.query(
      `SELECT
         pu.tema_id,
         t.nombre AS tema_nombre,
         m.nombre AS materia_nombre,
         o.nombre AS oposicion_nombre,
         pu.aciertos,
         pu.errores,
         ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 0) AS porcentaje_acierto
       FROM progreso_usuario pu
       JOIN temas t ON t.id = pu.tema_id
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       WHERE pu.usuario_id = $1
         AND (pu.aciertos + pu.errores) >= 5
       ORDER BY porcentaje_acierto ASC NULLS FIRST, pu.errores DESC
       LIMIT 3`,
      [userId],
    );

    return result.rows.map((row) => ({
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      materiaNombre: row.materia_nombre,
      oposicionNombre: row.oposicion_nombre,
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
    }));
  },
};
