import pool from '../config/db.js';
import { resolveWidgetModeOptions, widgetModeSql } from './widgetStatsModeFilter.js';

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
      `SELECT p.bloque_id,
              bl.nombre AS bloque_nombre,
              COUNT(*)::int AS pendientes
       FROM repeticion_espaciada re
       JOIN preguntas p ON p.id = re.pregunta_id
       JOIN bloques bl ON bl.id = p.bloque_id
       WHERE re.usuario_id = $1
         AND re.proxima_revision <= NOW()
       GROUP BY p.bloque_id, bl.nombre
       ORDER BY pendientes DESC
       LIMIT 1`,
      [userId],
    );

    const pendienteTop = pendientesResult.rows[0];
    if (pendienteTop) {
      const numeroPreguntas = Math.min(20, Math.max(5, Number(pendienteTop.pendientes)));
      return {
        modo: 'repaso',
        bloqueId: Number(pendienteTop.bloque_id),
        oposicionId,
        numeroPreguntas,
        motivo: `Tienes ${Number(pendienteTop.pendientes)} preguntas pendientes en ${pendienteTop.bloque_nombre}`,
      };
    }

    // Bloques practicados en las últimas 24h para evitar repetir la misma sugerencia
    const recientesResult = await pool.query(
      `SELECT DISTINCT p.bloque_id::int
       FROM tests t
       JOIN tests_preguntas tp ON tp.test_id = t.id
       JOIN preguntas p ON p.id = tp.pregunta_id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND t.fecha_creacion >= NOW() - INTERVAL '24 hours'
         AND p.bloque_id IS NOT NULL`,
      [userId],
    );
    const recientes = recientesResult.rows.map((r) => Number(r.bloque_id));

    // Bloque débil: intenta excluir los practicados hoy; si no hay resultado, sin exclusión
    const buildDebilQuery = (withExclude) => {
      const excludeClause = withExclude && recientes.length > 0
        ? 'AND pu.bloque_id != ALL($2::bigint[])'
        : '';
      const params = withExclude && recientes.length > 0 ? [userId, recientes] : [userId];
      return { excludeClause, params };
    };

    const runDebil = async (withExclude) => {
      const { excludeClause, params } = buildDebilQuery(withExclude);
      return pool.query(
        `SELECT pu.bloque_id,
                bl.nombre AS bloque_nombre,
                pu.aciertos,
                pu.errores,
                ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 0) AS porcentaje_acierto
         FROM progreso_usuario pu
         JOIN bloques bl ON bl.id = pu.bloque_id
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

    const bloqueDebil = debilResult.rows[0];
    if (bloqueDebil) {
      // Busca un segundo bloque con preguntas sin ver para mezclar (50% débil + 50% nuevo)
      const excluirNuevo = [Number(bloqueDebil.bloque_id), ...recientes];
      const nuevoResult = await pool.query(
        `SELECT bl.id AS bloque_id, bl.nombre AS bloque_nombre
         FROM colecciones bl
         JOIN preguntas p ON p.bloque_id = bl.id
         WHERE bl.id != ALL($2::bigint[])
           AND NOT EXISTS (
             SELECT 1 FROM progreso_usuario pu
             WHERE pu.bloque_id = bl.id AND pu.usuario_id = $1
           )
         GROUP BY bl.id, bl.nombre
         HAVING COUNT(p.id) >= 5
         ORDER BY RANDOM()
         LIMIT 1`,
        [userId, excluirNuevo],
      );

      if (nuevoResult.rows[0]) {
        const bloqueNuevo = nuevoResult.rows[0];
        return {
          modo: 'adaptativo',
          bloqueId: null,
          oposicionId,
          temasMix: [
            { bloqueId: Number(bloqueDebil.bloque_id), pct: 50 },
            { bloqueId: Number(bloqueNuevo.bloque_id), pct: 50 },
          ],
          numeroPreguntas: 10,
          motivo: `Combina "${bloqueDebil.bloque_nombre}" (tu punto débil) con "${bloqueNuevo.bloque_nombre}" (bloque nuevo).`,
        };
      }

      return {
        modo: 'adaptativo',
        bloqueId: Number(bloqueDebil.bloque_id),
        oposicionId,
        numeroPreguntas: 10,
        motivo: `Activa tu sesion reforzando "${bloqueDebil.bloque_nombre}" (acierto ${Number(bloqueDebil.porcentaje_acierto ?? 0)}%)`,
      };
    }

    return {
      modo: 'adaptativo',
      bloqueId: null,
      oposicionId,
      numeroPreguntas: 10,
      motivo: 'Empieza con un test adaptativo rapido para activar tu sesion',
    };
  },

  async getObjetivoDiario(userId, oposicionId = null, options = {}) {
    const { modoPreparacion, albacerModuloId } = resolveWidgetModeOptions(options);
    const result = await pool.query(
      `WITH objetivo AS (
         SELECT COALESCE(objetivo_diario_preguntas, 10)::int AS valor
         FROM usuarios WHERE id = $1
       ),
       actividad AS (
         SELECT
           gs::date AS dia,
           COUNT(t.id)::int AS respondidas
         FROM generate_series(CURRENT_DATE - INTERVAL '59 days', CURRENT_DATE, INTERVAL '1 day') gs
         LEFT JOIN respuestas_usuario ru ON ru.fecha_respuesta::date = gs::date
         LEFT JOIN tests t ON t.id = ru.test_id
           AND t.usuario_id = $1
           AND ($2::bigint IS NULL OR t.oposicion_id = $2)
           ${widgetModeSql('t')}
         GROUP BY gs::date
         ORDER BY gs::date DESC
       )
       SELECT
         (SELECT valor FROM objetivo) AS objetivo_preguntas_dia,
         a.dia::text,
         a.respondidas
       FROM actividad a`,
      [userId, oposicionId, modoPreparacion, albacerModuloId],
    );

    const objetivoPreguntasDia = Math.max(1, Number(result.rows[0]?.objetivo_preguntas_dia ?? 30));
    const actividad = result.rows.map((row) => ({
      dia: row.dia,
      respondidas: Number(row.respondidas ?? 0),
      cumplido: Number(row.respondidas ?? 0) >= objetivoPreguntasDia,
    }));
    const preguntasRespondidasHoy = actividad[0]?.respondidas ?? 0;
    const porcentajeCumplido = Math.min(100, Math.round((preguntasRespondidasHoy / objetivoPreguntasDia) * 100));
    const inicioSemana = new Date();
    inicioSemana.setHours(0, 0, 0, 0);
    inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7));

    const diasCumplidosSemana = actividad.filter((dia) => {
      const fecha = new Date(`${dia.dia}T00:00:00`);
      return fecha >= inicioSemana && dia.cumplido;
    }).length;

    let rachaObjetivos = 0;
    for (const dia of actividad) {
      if (!dia.cumplido) break;
      rachaObjetivos += 1;
    }

    return {
      objetivoPreguntasDia,
      preguntasRespondidasHoy,
      porcentajeCumplido,
      cumplido: preguntasRespondidasHoy >= objetivoPreguntasDia,
      diasCumplidosSemana,
      rachaObjetivos,
    };
  },
};
