import pool from '../config/db.js';

export const widgetEngagementFocoTemasRepository = {
  async getTemasDebiles(userId, oposicionId = null) {
    const result = await pool.query(
      `SELECT
         pu.bloque_id,
         bl.nombre AS bloque_nombre,
         t.id AS tema_id,
         t.nombre AS tema_nombre,
         o.id AS oposicion_id,
         o.nombre AS oposicion_nombre,
         pu.aciertos,
         pu.errores,
         ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 0) AS porcentaje_acierto
       FROM progreso_usuario pu
       JOIN bloques bl ON bl.id = pu.bloque_id
       JOIN temas t ON t.id = bl.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       WHERE pu.usuario_id = $1
         AND ($2::bigint IS NULL OR t.oposicion_id = $2)
         AND (pu.aciertos + pu.errores) >= 5
       ORDER BY porcentaje_acierto ASC NULLS FIRST, pu.errores DESC
       LIMIT 3`,
      [userId, oposicionId],
    );

    return result.rows.map((row) => ({
      bloqueId: Number(row.bloque_id),
      bloqueNombre: row.bloque_nombre,
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      oposicionId: Number(row.oposicion_id),
      oposicionNombre: row.oposicion_nombre,
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
    }));
  },
};
