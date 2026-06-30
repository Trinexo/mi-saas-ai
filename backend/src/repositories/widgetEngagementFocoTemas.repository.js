import pool from '../config/db.js';
import { resolveWidgetModeOptions, widgetModeSql } from './widgetStatsModeFilter.js';

export const widgetEngagementFocoTemasRepository = {
  async getTemasDebiles(userId, oposicionId = null, options = {}) {
    const { modoPreparacion, albacerModuloId } = resolveWidgetModeOptions(options);
    const result = await pool.query(
      `SELECT
         bl.id AS bloque_id,
         bl.nombre AS bloque_nombre,
         t.id AS tema_id,
         t.nombre AS tema_nombre,
         o.id AS oposicion_id,
         o.nombre AS oposicion_nombre,
         COUNT(ru.id) FILTER (WHERE ru.correcta = true)::int AS aciertos,
         COUNT(ru.id) FILTER (WHERE ru.correcta = false)::int AS errores,
         ROUND(
           COUNT(ru.id) FILTER (WHERE ru.correcta = true)::numeric
           / NULLIF(COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NOT NULL), 0) * 100,
           0
         ) AS porcentaje_acierto
       FROM tests ts
       JOIN respuestas_usuario ru ON ru.test_id = ts.id
       JOIN preguntas p ON p.id = ru.pregunta_id
       JOIN bloques bl ON bl.id = p.bloque_id
       JOIN temas t ON t.id = bl.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       WHERE ts.usuario_id = $1
         AND ts.estado = 'finalizado'
         AND ($2::bigint IS NULL OR t.oposicion_id = $2)
         AND ru.respuesta_id IS NOT NULL
         ${widgetModeSql('ts')}
       GROUP BY bl.id, bl.nombre, t.id, t.nombre, o.id, o.nombre
       HAVING COUNT(ru.id) FILTER (WHERE ru.respuesta_id IS NOT NULL) >= 5
       ORDER BY porcentaje_acierto ASC NULLS FIRST, errores DESC
       LIMIT 3`,
      [userId, oposicionId, modoPreparacion, albacerModuloId],
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
