import pool from '../config/db.js';

export const widgetEngagementFocoSesionRepository = {
  async getFocoHoy(userId) {
    // Oposición primaria del usuario (para scope del generate)
    const oposicionResult = await pool.query(
      `SELECT oposicion_id FROM accesos_oposicion
       WHERE usuario_id = $1 AND estado = 'activo'
         AND (fecha_fin IS NULL OR fecha_fin > NOW())
       ORDER BY fecha_inicio DESC LIMIT 1`,
      [userId],
    );
    const oposicionId = oposicionResult.rows[0]?.oposicion_id
      ? Number(oposicionResult.rows[0].oposicion_id)
      : null;

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
        oposicionId,
        numeroPreguntas,
        motivo: `Tienes ${Number(pendienteTop.pendientes)} preguntas pendientes en ${pendienteTop.tema_nombre}`,
      };
    }

    // Temas practicados en las últimas 24h para evitar repetir la misma sugerencia
    const recientesResult = await pool.query(
      `SELECT DISTINCT p.tema_id::int
       FROM tests t
       JOIN tests_preguntas tp ON tp.test_id = t.id
       JOIN preguntas p ON p.id = tp.pregunta_id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND t.fecha_creacion >= NOW() - INTERVAL '24 hours'
         AND p.tema_id IS NOT NULL`,
      [userId],
    );
    const recientes = recientesResult.rows.map((r) => Number(r.tema_id));

    // Tema débil: intenta excluir los practicados hoy; si no hay resultado, sin exclusión
    const buildDebilQuery = (withExclude) => {
      const excludeClause = withExclude && recientes.length > 0
        ? 'AND pu.tema_id != ALL($2::bigint[])'
        : '';
      const params = withExclude && recientes.length > 0 ? [userId, recientes] : [userId];
      return { excludeClause, params };
    };

    const runDebil = async (withExclude) => {
      const { excludeClause, params } = buildDebilQuery(withExclude);
      return pool.query(
        `SELECT pu.tema_id,
                t.nombre AS tema_nombre,
                pu.aciertos,
                pu.errores,
                ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 0) AS porcentaje_acierto
         FROM progreso_usuario pu
         JOIN temas t ON t.id = pu.tema_id
         WHERE pu.usuario_id = $1
           AND (pu.aciertos + pu.errores) >= 10
           ${excludeClause}
         ORDER BY porcentaje_acierto ASC NULLS FIRST, (pu.errores - pu.aciertos) DESC
         LIMIT 1`,
        params,
      );
    };

    let debilResult = await runDebil(true);
    if (!debilResult.rows[0] && recientes.length > 0) {
      debilResult = await runDebil(false);
    }

    const temaDebil = debilResult.rows[0];
    if (temaDebil) {
      // Busca un segundo tema con preguntas sin ver para mezclar (50% débil + 50% nuevo)
      const excluirNuevo = [Number(temaDebil.tema_id), ...recientes];
      const nuevoResult = await pool.query(
        `SELECT t.id AS tema_id, t.nombre AS tema_nombre
         FROM temas t
         JOIN preguntas p ON p.tema_id = t.id
         WHERE t.id != ALL($2::bigint[])
           AND NOT EXISTS (
             SELECT 1 FROM progreso_usuario pu
             WHERE pu.tema_id = t.id AND pu.usuario_id = $1
           )
         GROUP BY t.id, t.nombre
         HAVING COUNT(p.id) >= 5
         ORDER BY RANDOM()
         LIMIT 1`,
        [userId, excluirNuevo],
      );

      if (nuevoResult.rows[0]) {
        const temaNuevo = nuevoResult.rows[0];
        return {
          modo: 'adaptativo',
          temaId: null,
          oposicionId,
          temasMix: [
            { temaId: Number(temaDebil.tema_id), pct: 50 },
            { temaId: Number(temaNuevo.tema_id), pct: 50 },
          ],
          numeroPreguntas: 10,
          motivo: `Combina "${temaDebil.tema_nombre}" (tu punto débil) con "${temaNuevo.tema_nombre}" (tema nuevo).`,
        };
      }

      return {
        modo: 'adaptativo',
        temaId: Number(temaDebil.tema_id),
        oposicionId,
        numeroPreguntas: 10,
        motivo: `Activa tu sesion reforzando "${temaDebil.tema_nombre}" (acierto ${Number(temaDebil.porcentaje_acierto ?? 0)}%)`,
      };
    }

    return {
      modo: 'adaptativo',
      temaId: null,
      oposicionId,
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
