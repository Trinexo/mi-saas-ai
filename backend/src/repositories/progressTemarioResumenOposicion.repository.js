import pool from '../config/db.js';

export const progressTemarioResumenOposicionRepository = {
  async getResumenOposicion(userId, oposicionId) {
    const [metaResult, progresoResult, testResult] = await Promise.all([
      pool.query(
        `SELECT o.nombre AS oposicion_nombre,
                COUNT(DISTINCT t.id)::int AS total_temas
         FROM oposiciones o
         JOIN materias m ON m.oposicion_id = o.id
         JOIN temas t ON t.materia_id = m.id
         WHERE o.id = $1
         GROUP BY o.nombre`,
        [oposicionId],
      ),
      pool.query(
        `SELECT
           COUNT(DISTINCT pu.tema_id)::int AS temas_practicados,
           COALESCE(SUM(pu.aciertos + pu.errores), 0)::int AS total_respondidas,
           COALESCE(ROUND(AVG(
             CASE WHEN (pu.aciertos + pu.errores) > 0
               THEN (pu.aciertos::numeric / (pu.aciertos + pu.errores)) * 100
             END
           )::numeric, 1), 0) AS porcentaje_acierto_medio
         FROM progreso_usuario pu
         JOIN temas t ON t.id = pu.tema_id
         JOIN materias m ON m.id = t.materia_id
         WHERE pu.usuario_id = $1
           AND m.oposicion_id = $2
           AND (pu.aciertos + pu.errores) > 0`,
        [userId, oposicionId],
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS tests_realizados,
           COALESCE(ROUND(AVG(rt.nota)::numeric, 2), 0) AS nota_media
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         JOIN temas te ON te.id = t.tema_id
         JOIN materias m ON m.id = te.materia_id
         WHERE t.usuario_id = $1
           AND m.oposicion_id = $2
           AND t.estado = 'finalizado'`,
        [userId, oposicionId],
      ),
    ]);

    const totalTemas = Number(metaResult.rows[0]?.total_temas ?? 0);
    const temasPracticados = Number(progresoResult.rows[0]?.temas_practicados ?? 0);
    const totalRespondidas = Number(progresoResult.rows[0]?.total_respondidas ?? 0);
    const porcentajeAcierto = Number(progresoResult.rows[0]?.porcentaje_acierto_medio ?? 0);
    const testsRealizados = Number(testResult.rows[0]?.tests_realizados ?? 0);
    const notaMedia = Number(testResult.rows[0]?.nota_media ?? 0);
    const maestria = totalTemas > 0 ? Number(((temasPracticados / totalTemas) * 100).toFixed(1)) : 0;

    return {
      oposicionId: Number(oposicionId),
      oposicionNombre: metaResult.rows[0]?.oposicion_nombre ?? '',
      totalTemas,
      temasPracticados,
      maestria,
      totalRespondidas,
      porcentajeAcierto,
      testsRealizados,
      notaMedia,
    };
  },
};
