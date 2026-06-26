import pool from '../config/db.js';

export const progressTemarioResumenOposicionRepository = {
  async getResumenOposicion(userId, oposicionId, options = {}) {
    const { modoPreparacion = 'experto', albacerModuloId = null } = options ?? {};
    const [metaResult, progresoResult, testResult, dominioResult] = await Promise.all([
      pool.query(
        `SELECT o.nombre AS oposicion_nombre,
                COUNT(DISTINCT t.id)::int AS total_bloques,
                COUNT(DISTINCT p.id)::int AS total_preguntas
         FROM oposiciones o
         JOIN temas t ON t.oposicion_id = o.id
         LEFT JOIN preguntas p ON p.tema_id = t.id
         WHERE o.id = $1
         GROUP BY o.nombre`,
        [oposicionId],
      ),
      pool.query(
        `SELECT
           COUNT(DISTINCT p.tema_id)::int AS bloques_practicados,
           COUNT(ru.id)::int AS total_respondidas,
           COALESCE(ROUND(
             CASE WHEN COUNT(ru.id) > 0
               THEN (SUM(CASE WHEN ru.correcta THEN 1 ELSE 0 END)::numeric / COUNT(ru.id)) * 100
             END::numeric, 1
           ), 0) AS porcentaje_acierto_medio
         FROM respuestas_usuario ru
         JOIN tests ts ON ts.id = ru.test_id
         JOIN preguntas p ON p.id = ru.pregunta_id
         JOIN temas t ON t.id = p.tema_id
         WHERE ts.usuario_id = $1
           AND t.oposicion_id = $2
           AND ts.estado = 'finalizado'
           AND ts.modo_preparacion = $3
           AND ($4::bigint IS NULL OR ts.albacer_modulo_id = $4)`,
        [userId, oposicionId, modoPreparacion, albacerModuloId],
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS tests_realizados,
           COALESCE(ROUND(AVG(rt.nota)::numeric, 2), 0) AS nota_media
         FROM tests ts
         JOIN resultados_test rt ON rt.test_id = ts.id
         WHERE ts.usuario_id = $1
           AND ts.oposicion_id = $2
           AND ts.estado = 'finalizado'
           AND ts.modo_preparacion = $3
           AND ($4::bigint IS NULL OR ts.albacer_modulo_id = $4)`,
        [userId, oposicionId, modoPreparacion, albacerModuloId],
      ),
      pool.query(
        `SELECT COUNT(DISTINCT ru.pregunta_id)::int AS dominadas
         FROM respuestas_usuario ru
         JOIN tests ts ON ts.id = ru.test_id
         JOIN preguntas p ON p.id = ru.pregunta_id
         JOIN temas t ON t.id = p.tema_id
         WHERE ts.usuario_id = $1
           AND ts.estado = 'finalizado'
           AND ru.correcta = true
           AND t.oposicion_id = $2
           AND ts.modo_preparacion = $3
           AND ($4::bigint IS NULL OR ts.albacer_modulo_id = $4)`,
        [userId, oposicionId, modoPreparacion, albacerModuloId],
      ),
    ]);

    const totalBloques = Number(metaResult.rows[0]?.total_bloques ?? 0);
    const totalPreguntas = Number(metaResult.rows[0]?.total_preguntas ?? 0);
    const bloquesPracticados = Number(progresoResult.rows[0]?.bloques_practicados ?? 0);
    const totalRespondidas = Number(progresoResult.rows[0]?.total_respondidas ?? 0);
    const porcentajeAcierto = Number(progresoResult.rows[0]?.porcentaje_acierto_medio ?? 0);
    const testsRealizados = Number(testResult.rows[0]?.tests_realizados ?? 0);
    const notaMedia = Number(testResult.rows[0]?.nota_media ?? 0);
    const dominadas = Number(dominioResult.rows[0]?.dominadas ?? 0);
    const dominio = totalPreguntas > 0 ? Number(((dominadas / totalPreguntas) * 100).toFixed(1)) : 0;

    return {
      oposicionId: Number(oposicionId),
      oposicionNombre: metaResult.rows[0]?.oposicion_nombre ?? '',
      totalBloques,
      totalPreguntas,
      bloquesPracticados,
      dominadas,
      dominio,
      totalRespondidas,
      porcentajeAcierto,
      testsRealizados,
      notaMedia,
    };
  },
};
