import pool from '../config/db.js';

export const progressTemarioDetalleBrowseRepository = {
  async getProgresoTemas(userId, oposicionId) {
    const conditions = ['pu.usuario_id = $1', '(pu.aciertos + pu.errores) > 0'];
    const params = [userId];
    if (oposicionId) { conditions.push('m.oposicion_id = $2'); params.push(oposicionId); }
    const where = conditions.join(' AND ');

    const result = await pool.query(
      `SELECT
         pu.tema_id,
         t.nombre AS tema_nombre,
         m.id AS materia_id,
         m.nombre AS materia_nombre,
         o.id AS oposicion_id,
         o.nombre AS oposicion_nombre,
         pu.aciertos,
         pu.errores,
         (pu.aciertos + pu.errores) AS total_respondidas,
         ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 1) AS porcentaje_acierto
       FROM progreso_usuario pu
       JOIN temas t ON t.id = pu.tema_id
       JOIN materias m ON m.id = t.materia_id
       JOIN oposiciones o ON o.id = m.oposicion_id
       WHERE ${where}
       ORDER BY m.nombre ASC, porcentaje_acierto ASC NULLS FIRST`,
      params,
    );

    return result.rows.map((row) => ({
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      materiaId: Number(row.materia_id),
      materiaNombre: row.materia_nombre,
      oposicionId: Number(row.oposicion_id),
      oposicionNombre: row.oposicion_nombre,
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      totalRespondidas: Number(row.total_respondidas ?? 0),
      porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
    }));
  },

  async getProgresoMaterias(userId, oposicionId) {
    const result = await pool.query(
      `SELECT
         m.id AS materia_id,
         m.nombre AS materia_nombre,
         COUNT(DISTINCT t.id)::int AS total_temas,
         COUNT(DISTINCT CASE WHEN (pu.aciertos + pu.errores) > 0 THEN pu.tema_id END)::int AS temas_practicados,
         COALESCE(ROUND(AVG(
           CASE WHEN (pu.aciertos + pu.errores) > 0
             THEN (pu.aciertos::numeric / (pu.aciertos + pu.errores)) * 100
           END
         )::numeric, 1), 0) AS porcentaje_acierto
       FROM materias m
       JOIN temas t ON t.materia_id = m.id
       LEFT JOIN progreso_usuario pu ON pu.tema_id = t.id AND pu.usuario_id = $1
       WHERE m.oposicion_id = $2
       GROUP BY m.id, m.nombre
       ORDER BY m.nombre ASC`,
      [userId, oposicionId],
    );

    return result.rows.map((row) => {
      const totalTemas = Number(row.total_temas ?? 0);
      const temasPracticados = Number(row.temas_practicados ?? 0);
      const maestria = totalTemas > 0 ? Number(((temasPracticados / totalTemas) * 100).toFixed(1)) : 0;
      return {
        materiaId: Number(row.materia_id),
        materiaNombre: row.materia_nombre,
        totalTemas,
        temasPracticados,
        maestria,
        porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
      };
    });
  },
};
