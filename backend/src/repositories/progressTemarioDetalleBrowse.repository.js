import pool from '../config/db.js';

export const progressTemarioDetalleBrowseRepository = {
  async getProgresoBloques(userId, oposicionId) {
    const conditions = ['pu.usuario_id = $1', '(pu.aciertos + pu.errores) > 0'];
    const params = [userId];
    if (oposicionId) { conditions.push('t.oposicion_id = $2'); params.push(oposicionId); }
    const where = conditions.join(' AND ');

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
         (pu.aciertos + pu.errores) AS total_respondidas,
         ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 1) AS porcentaje_acierto
       FROM progreso_usuario pu
       JOIN bloques bl ON bl.id = pu.bloque_id
       JOIN temas t    ON t.id  = bl.tema_id
       JOIN oposiciones o ON o.id = t.oposicion_id
       WHERE ${where}
       ORDER BY t.nombre ASC, porcentaje_acierto ASC NULLS FIRST`,
      params,
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
      totalRespondidas: Number(row.total_respondidas ?? 0),
      porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
    }));
  },

  async getProgresoTemas(userId, oposicionId) {
    const result = await pool.query(
      `SELECT
         t.id AS tema_id,
         t.nombre AS tema_nombre,
         COUNT(DISTINCT bl.id)::int AS total_bloques,
         COUNT(DISTINCT CASE WHEN (pu.aciertos + pu.errores) > 0 THEN pu.bloque_id END)::int AS bloques_practicados,
         COUNT(DISTINCT p.id)::int AS total_preguntas,
         COUNT(DISTINCT CASE WHEN ru.correcta = true THEN ru.pregunta_id END)::int AS dominadas,
         COALESCE(ROUND(AVG(
           CASE WHEN (pu.aciertos + pu.errores) > 0
             THEN (pu.aciertos::numeric / (pu.aciertos + pu.errores)) * 100
           END
         )::numeric, 1), 0) AS porcentaje_acierto
       FROM temas t
       JOIN bloques bl ON bl.tema_id = t.id
       LEFT JOIN preguntas p ON p.bloque_id = bl.id
       LEFT JOIN progreso_usuario pu ON pu.bloque_id = bl.id AND pu.usuario_id = $1
       LEFT JOIN tests ts ON ts.usuario_id = $1 AND ts.estado = 'finalizado'
       LEFT JOIN respuestas_usuario ru ON ru.test_id = ts.id AND ru.pregunta_id = p.id
       WHERE t.oposicion_id = $2
       GROUP BY t.id, t.nombre
       ORDER BY t.nombre ASC`,
      [userId, oposicionId],
    );

    return result.rows.map((row) => {
      const totalPreguntas = Number(row.total_preguntas ?? 0);
      const dominadas = Number(row.dominadas ?? 0);
      const dominio = totalPreguntas > 0 ? Number(((dominadas / totalPreguntas) * 100).toFixed(1)) : 0;
      return {
        temaId: Number(row.tema_id),
        temaNombre: row.tema_nombre,
        totalBloques: Number(row.total_bloques ?? 0),
        bloquesPracticados: Number(row.bloques_practicados ?? 0),
        totalPreguntas,
        dominadas,
        dominio,
        porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
      };
    });
  },
};
