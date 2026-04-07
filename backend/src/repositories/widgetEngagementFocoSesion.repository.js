import pool from '../config/db.js';

export const widgetEngagementFocoSesionRepository = {
  async getFocoHoy(userId) {
    const pendientesResult = await pool.query(
      `SELECT p.tema_id,
              t.nombre AS tema_nombre,
              COUNT(*)::int AS pendientes
       FROM repeticion_espaciada re
       JOIN preguntas p ON p.id = re.pregunta_id
       JOIN temas t ON t.id = p.tema_id
       WHERE re.usuario_id = $1
         AND re.proxima_revision <= NOW()
       GROUP BY p.tema_id, t.nombre
       ORDER BY pendientes DESC
       LIMIT 1`,
      [userId],
    );

    const pendienteTop = pendientesResult.rows[0];
    if (pendienteTop) {
      const numeroPreguntas = Math.min(20, Math.max(5, Number(pendienteTop.pendientes)));
      return {
        modo: 'repaso',
        temaId: Number(pendienteTop.tema_id),
        numeroPreguntas,
        motivo: `Tienes ${Number(pendienteTop.pendientes)} preguntas pendientes en ${pendienteTop.tema_nombre}`,
      };
    }

    const debilResult = await pool.query(
      `SELECT pu.tema_id,
              t.nombre AS tema_nombre,
              pu.aciertos,
              pu.errores,
              ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 0) AS porcentaje_acierto
       FROM progreso_usuario pu
       JOIN temas t ON t.id = pu.tema_id
       WHERE pu.usuario_id = $1
         AND (pu.aciertos + pu.errores) >= 10
       ORDER BY porcentaje_acierto ASC NULLS FIRST, (pu.errores - pu.aciertos) DESC
       LIMIT 1`,
      [userId],
    );

    const temaDebil = debilResult.rows[0];
    if (temaDebil) {
      return {
        modo: 'refuerzo',
        temaId: Number(temaDebil.tema_id),
        numeroPreguntas: 10,
        motivo: `Refuerza ${temaDebil.tema_nombre} (acierto actual ${Number(temaDebil.porcentaje_acierto ?? 0)}%)`,
      };
    }

    return {
      modo: 'adaptativo',
      temaId: null,
      numeroPreguntas: 10,
      motivo: 'Empieza con un test adaptativo rapido para activar tu sesion',
    };
  },

  async getObjetivoDiario(userId) {
    const result = await pool.query(
      `WITH objetivo AS (
         SELECT COALESCE(objetivo_diario_preguntas, 10)::int AS valor
         FROM usuarios WHERE id = $1
       ),
       respondidas AS (
         SELECT COUNT(*)::int AS valor
         FROM respuestas_usuario ru
         JOIN tests t ON t.id = ru.test_id
         WHERE t.usuario_id = $1
           AND ru.fecha_respuesta::date = CURRENT_DATE
       )
       SELECT
         (SELECT valor FROM objetivo) AS objetivo_preguntas_dia,
         (SELECT valor FROM respondidas) AS preguntas_respondidas_hoy`,
      [userId],
    );

    const objetivoPreguntasDia = Number(result.rows[0]?.objetivo_preguntas_dia ?? 30);
    const preguntasRespondidasHoy = Number(result.rows[0]?.preguntas_respondidas_hoy ?? 0);
    const porcentajeCumplido = Math.min(100, Math.round((preguntasRespondidasHoy / objetivoPreguntasDia) * 100));

    return {
      objetivoPreguntasDia,
      preguntasRespondidasHoy,
      porcentajeCumplido,
      cumplido: preguntasRespondidasHoy >= objetivoPreguntasDia,
    };
  },
};
