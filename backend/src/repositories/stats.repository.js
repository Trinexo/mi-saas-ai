import pool from '../config/db.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toDayIndex = (isoDate) => {
  const [year, month, day] = String(isoDate).split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MS);
};

const calcBestStreak = (dayIndexesDesc) => {
  if (dayIndexesDesc.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let index = 1; index < dayIndexesDesc.length; index += 1) {
    if (dayIndexesDesc[index - 1] - dayIndexesDesc[index] === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
};

const calcCurrentStreak = (dayIndexesDesc, todayIndex) => {
  if (dayIndexesDesc.length === 0) return 0;

  const latestActivityIndex = dayIndexesDesc[0];
  const diffFromToday = todayIndex - latestActivityIndex;

  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let index = 1; index < dayIndexesDesc.length; index += 1) {
    if (dayIndexesDesc[index - 1] - dayIndexesDesc[index] === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

export const statsRepository = {
  async getConsistenciaDiaria(userId) {
    const summaryResult = await pool.query(
      `WITH actividad_30 AS (
         SELECT DISTINCT rt.fecha::date AS dia
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha::date >= CURRENT_DATE - INTERVAL '29 days'
       )
       SELECT
         COUNT(*)::int AS dias_activos_30,
         ROUND((COUNT(*)::numeric / 30) * 100, 2) AS porcentaje_constancia
       FROM actividad_30`,
      [userId],
    );

    const trendResult = await pool.query(
      `WITH ultimos14 AS (
         SELECT COUNT(DISTINCT rt.fecha::date)::int AS dias_activos
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha::date >= CURRENT_DATE - INTERVAL '13 days'
       ),
       previos14 AS (
         SELECT COUNT(DISTINCT rt.fecha::date)::int AS dias_activos
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha::date >= CURRENT_DATE - INTERVAL '27 days'
           AND rt.fecha::date < CURRENT_DATE - INTERVAL '13 days'
       )
       SELECT
         (SELECT dias_activos FROM ultimos14) - (SELECT dias_activos FROM previos14) AS delta_dias_activos`,
      [userId],
    );

    const row = summaryResult.rows[0] ?? {};
    const diasActivos30 = Number(row.dias_activos_30 ?? 0);
    const porcentajeConstancia = Number(row.porcentaje_constancia ?? 0);
    const diasInactivos30 = Math.max(0, 30 - diasActivos30);

    const deltaDiasActivos = Number(trendResult.rows[0]?.delta_dias_activos ?? 0);
    let tendenciaConstancia = 'estable';
    if (deltaDiasActivos >= 2) tendenciaConstancia = 'mejorando';
    else if (deltaDiasActivos <= -2) tendenciaConstancia = 'empeorando';

    return {
      diasActivos30,
      diasInactivos30,
      porcentajeConstancia,
      tendenciaConstancia,
    };
  },

  async getRitmoPregunta(userId) {
    const summaryResult = await pool.query(
      `SELECT
         COUNT(*)::int AS tests_analizados,
         COALESCE(SUM(rt.tiempo_segundos), 0)::int AS tiempo_total_segundos,
         COALESCE(SUM(rt.aciertos + rt.errores + rt.blancos), 0)::int AS preguntas_analizadas
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND rt.fecha >= NOW() - INTERVAL '30 days'`,
      [userId],
    );

    const trendResult = await pool.query(
      `WITH ultimos7 AS (
         SELECT
           COALESCE(SUM(rt.tiempo_segundos), 0)::numeric AS tiempo_total,
           COALESCE(SUM(rt.aciertos + rt.errores + rt.blancos), 0)::numeric AS preguntas_total
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha >= NOW() - INTERVAL '7 days'
       ),
       previos7 AS (
         SELECT
           COALESCE(SUM(rt.tiempo_segundos), 0)::numeric AS tiempo_total,
           COALESCE(SUM(rt.aciertos + rt.errores + rt.blancos), 0)::numeric AS preguntas_total
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha < NOW() - INTERVAL '7 days'
           AND rt.fecha >= NOW() - INTERVAL '14 days'
       )
       SELECT ROUND(
         (COALESCE((SELECT tiempo_total / NULLIF(preguntas_total, 0) FROM ultimos7), 0))
         -
         (COALESCE((SELECT tiempo_total / NULLIF(preguntas_total, 0) FROM previos7), 0)),
         2
       ) AS delta_segundos_por_pregunta`,
      [userId],
    );

    const row = summaryResult.rows[0] ?? {};
    const testsAnalizados = Number(row.tests_analizados ?? 0);
    const preguntasAnalizadas = Number(row.preguntas_analizadas ?? 0);
    const tiempoTotalSegundos = Number(row.tiempo_total_segundos ?? 0);

    const segundosMediosPorPregunta = preguntasAnalizadas > 0
      ? Number((tiempoTotalSegundos / preguntasAnalizadas).toFixed(2))
      : 0;

    const deltaSegundosPorPregunta = Number(trendResult.rows[0]?.delta_segundos_por_pregunta ?? 0);
    let tendenciaRitmo = 'estable';
    if (deltaSegundosPorPregunta <= -5) tendenciaRitmo = 'mejorando';
    else if (deltaSegundosPorPregunta >= 5) tendenciaRitmo = 'empeorando';

    return {
      segundosMediosPorPregunta,
      preguntasAnalizadas,
      testsAnalizados,
      tendenciaRitmo,
    };
  },

  async getBalancePrecision(userId) {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(rt.aciertos), 0)::int AS aciertos_totales,
         COALESCE(SUM(rt.errores), 0)::int AS errores_totales,
         COALESCE(SUM(rt.blancos), 0)::int AS blancos_totales
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND rt.fecha >= NOW() - INTERVAL '30 days'`,
      [userId],
    );

    const row = result.rows[0] ?? {};
    const aciertosTotales = Number(row.aciertos_totales ?? 0);
    const erroresTotales = Number(row.errores_totales ?? 0);
    const blancosTotales = Number(row.blancos_totales ?? 0);
    const total = aciertosTotales + erroresTotales + blancosTotales;

    const porcentajeAcierto = total > 0 ? Number(((aciertosTotales * 100) / total).toFixed(2)) : 0;
    const porcentajeError = total > 0 ? Number(((erroresTotales * 100) / total).toFixed(2)) : 0;
    const porcentajeBlanco = total > 0 ? Number(((blancosTotales * 100) / total).toFixed(2)) : 0;

    return {
      aciertosTotales,
      erroresTotales,
      blancosTotales,
      porcentajeAcierto,
      porcentajeError,
      porcentajeBlanco,
    };
  },

  async getEficienciaTiempo(userId) {
    const summaryResult = await pool.query(
      `SELECT
         COUNT(*)::int AS tests_analizados,
         COALESCE(ROUND(AVG(rt.tiempo_segundos), 0), 0)::int AS tiempo_medio_por_test_segundos,
         COALESCE(SUM(rt.aciertos), 0)::int AS aciertos_totales,
         COALESCE(SUM(rt.tiempo_segundos), 0)::int AS tiempo_total_segundos
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND rt.fecha >= NOW() - INTERVAL '30 days'`,
      [userId],
    );

    const trendResult = await pool.query(
      `WITH ultimos7 AS (
         SELECT COALESCE(AVG(rt.tiempo_segundos), 0)::numeric AS avg_tiempo
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha >= NOW() - INTERVAL '7 days'
       ),
       previos7 AS (
         SELECT COALESCE(AVG(rt.tiempo_segundos), 0)::numeric AS avg_tiempo
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha < NOW() - INTERVAL '7 days'
           AND rt.fecha >= NOW() - INTERVAL '14 days'
       )
       SELECT ROUND((SELECT avg_tiempo FROM ultimos7) - (SELECT avg_tiempo FROM previos7), 2) AS delta_tiempo`,
      [userId],
    );

    const row = summaryResult.rows[0] ?? {};
    const testsAnalizados = Number(row.tests_analizados ?? 0);
    const tiempoMedioPorTestSegundos = Number(row.tiempo_medio_por_test_segundos ?? 0);
    const aciertosTotales = Number(row.aciertos_totales ?? 0);
    const tiempoTotalSegundos = Number(row.tiempo_total_segundos ?? 0);
    const aciertosPorMinuto = tiempoTotalSegundos > 0
      ? Number(((aciertosTotales * 60) / tiempoTotalSegundos).toFixed(2))
      : 0;

    const deltaTiempo = Number(trendResult.rows[0]?.delta_tiempo ?? 0);
    let tendenciaTiempo = 'estable';
    if (deltaTiempo <= -15) tendenciaTiempo = 'mejorando';
    else if (deltaTiempo >= 15) tendenciaTiempo = 'empeorando';

    return {
      tiempoMedioPorTestSegundos,
      aciertosPorMinuto,
      testsAnalizados,
      tendenciaTiempo,
    };
  },

  async getProgresoSemanal(userId) {
    const diasResult = await pool.query(
      `SELECT
         gs::date::text AS fecha,
         COALESCE(a.tests, 0)::int AS tests,
         COALESCE(a.aciertos, 0)::int AS aciertos,
         COALESCE(a.errores, 0)::int AS errores,
         COALESCE(a.blancos, 0)::int AS blancos,
         COALESCE(a.nota_media, 0)::numeric AS nota_media
       FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') gs
       LEFT JOIN (
         SELECT
           rt.fecha::date AS dia,
           COUNT(*)::int AS tests,
           COALESCE(SUM(rt.aciertos), 0)::int AS aciertos,
           COALESCE(SUM(rt.errores), 0)::int AS errores,
           COALESCE(SUM(rt.blancos), 0)::int AS blancos,
           COALESCE(ROUND(AVG(rt.nota), 2), 0) AS nota_media
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha::date >= CURRENT_DATE - INTERVAL '6 days'
         GROUP BY rt.fecha::date
       ) a ON a.dia = gs::date
       ORDER BY fecha ASC`,
      [userId],
    );

    const dias = diasResult.rows.map((row) => ({
      fecha: row.fecha,
      tests: Number(row.tests ?? 0),
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      blancos: Number(row.blancos ?? 0),
      notaMedia: Number(row.nota_media ?? 0),
    }));

    const testsSemana = dias.reduce((acc, d) => acc + d.tests, 0);
    const totalNotaPonderada = dias.reduce((acc, d) => acc + (d.notaMedia * d.tests), 0);
    const notaMediaSemana = testsSemana > 0 ? Number((totalNotaPonderada / testsSemana).toFixed(2)) : 0;

    return {
      dias,
      testsSemana,
      notaMediaSemana,
    };
  },

  async getRendimientoModos(userId) {
    const result = await pool.query(
      `SELECT
         t.tipo_test AS modo,
         COUNT(*)::int AS tests,
         COALESCE(ROUND(AVG(rt.nota), 2), 0) AS nota_media,
         COALESCE(SUM(rt.aciertos), 0)::int AS aciertos_totales,
         COALESCE(SUM(rt.errores), 0)::int AS errores_totales
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND rt.fecha >= NOW() - INTERVAL '30 days'
       GROUP BY t.tipo_test
       ORDER BY nota_media DESC, tests DESC`,
      [userId],
    );

    return result.rows.map((row) => ({
      modo: row.modo,
      tests: Number(row.tests ?? 0),
      notaMedia: Number(row.nota_media ?? 0),
      aciertosTotales: Number(row.aciertos_totales ?? 0),
      erroresTotales: Number(row.errores_totales ?? 0),
    }));
  },

  async getInsightMensual(userId) {
    const result = await pool.query(
      `WITH ultimos30 AS (
         SELECT rt.nota, rt.aciertos
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha >= NOW() - INTERVAL '30 days'
       ),
       ultimos7 AS (
         SELECT COALESCE(AVG(rt.nota), 0)::numeric AS avg_nota
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha >= NOW() - INTERVAL '7 days'
       ),
       previos7 AS (
         SELECT COALESCE(AVG(rt.nota), 0)::numeric AS avg_nota
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha < NOW() - INTERVAL '7 days'
           AND rt.fecha >= NOW() - INTERVAL '14 days'
       )
       SELECT
         (SELECT COUNT(*)::int FROM ultimos30) AS tests_ultimos_30_dias,
         (SELECT COALESCE(SUM(aciertos), 0)::int FROM ultimos30) AS aciertos_ultimos_30_dias,
         (SELECT COALESCE(ROUND(AVG(nota), 2), 0) FROM ultimos30) AS nota_media_ultimos_30_dias,
         ROUND(((SELECT avg_nota FROM ultimos7) - (SELECT avg_nota FROM previos7)), 2) AS delta_nota_7_dias`,
      [userId],
    );

    const row = result.rows[0] ?? {};
    const deltaNota7Dias = Number(row.delta_nota_7_dias ?? 0);

    let tendencia = 'estable';
    if (deltaNota7Dias >= 0.25) tendencia = 'subiendo';
    else if (deltaNota7Dias <= -0.25) tendencia = 'bajando';

    return {
      testsUltimos30Dias: Number(row.tests_ultimos_30_dias ?? 0),
      aciertosUltimos30Dias: Number(row.aciertos_ultimos_30_dias ?? 0),
      notaMediaUltimos30Dias: Number(row.nota_media_ultimos_30_dias ?? 0),
      deltaNota7Dias,
      tendencia,
    };
  },

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

  async getActividad14Dias(userId) {
    const result = await pool.query(
      `SELECT gs::date::text AS fecha,
              COALESCE(a.tests, 0)::int AS tests
       FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') gs
       LEFT JOIN (
         SELECT rt.fecha::date AS dia, COUNT(*)::int AS tests
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
           AND rt.fecha::date >= CURRENT_DATE - INTERVAL '13 days'
         GROUP BY rt.fecha::date
       ) a ON a.dia = gs::date
       ORDER BY fecha ASC`,
      [userId],
    );

    const actividad14Dias = result.rows.map((row) => ({
      fecha: row.fecha,
      tests: Number(row.tests ?? 0),
      activo: Number(row.tests ?? 0) > 0,
    }));

    return {
      diasActivos14: actividad14Dias.filter((d) => d.activo).length,
      estudioHoy: actividad14Dias[actividad14Dias.length - 1]?.activo ?? false,
      actividad14Dias,
    };
  },

  async getResumenSemana(userId) {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS tests_ultimos_7_dias,
         COALESCE(ROUND(AVG(rt.nota)::numeric, 2), 0) AS nota_media_ultimos_7_dias,
         COALESCE(ROUND(AVG(rt.tiempo_segundos)::numeric, 0), 0)::int AS tiempo_medio_segundos_ultimos_7_dias,
         COALESCE(SUM(rt.aciertos), 0)::int AS aciertos_totales_ultimos_7_dias
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND t.fecha_fin >= NOW() - INTERVAL '7 days'`,
      [userId],
    );

    const row = result.rows[0] ?? {};
    return {
      testsUltimos7Dias: Number(row.tests_ultimos_7_dias ?? 0),
      notaMediaUltimos7Dias: Number(row.nota_media_ultimos_7_dias ?? 0),
      tiempoMedioSegundosUltimos7Dias: Number(row.tiempo_medio_segundos_ultimos_7_dias ?? 0),
      aciertosTotalesUltimos7Dias: Number(row.aciertos_totales_ultimos_7_dias ?? 0),
    };
  },

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
      motivo: 'Empieza con un test adaptativo rápido para activar tu sesión',
    };
  },

  async getGamificacion(userId) {
    const result = await pool.query(
      `WITH tests_finalizados AS (
         SELECT COUNT(*)::int AS total
         FROM tests
         WHERE usuario_id = $1
           AND estado = 'finalizado'
       ),
       aciertos_totales AS (
         SELECT COALESCE(SUM(rt.aciertos), 0)::int AS total
         FROM resultados_test rt
         JOIN tests t ON t.id = rt.test_id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
       )
       SELECT
         (SELECT total FROM tests_finalizados) AS total_tests,
         (SELECT total FROM aciertos_totales) AS total_aciertos`,
      [userId],
    );

    const totalTests = Number(result.rows[0]?.total_tests ?? 0);
    const totalAciertos = Number(result.rows[0]?.total_aciertos ?? 0);

    const xpTotal = totalTests * 10 + totalAciertos * 2;
    const nivelActual = Math.floor(xpTotal / 100) + 1;
    const xpNivelBase = (nivelActual - 1) * 100;
    const xpSiguienteNivel = nivelActual * 100;
    const progresoNivel = xpTotal - xpNivelBase;

    return {
      xpTotal,
      nivelActual,
      xpSiguienteNivel,
      progresoNivel,
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

  async getUserStats(userId) {
    const result = await pool.query(
      `SELECT COUNT(rt.test_id)::int AS total_tests,
              COALESCE(SUM(rt.aciertos), 0)::int AS aciertos,
              COALESCE(SUM(rt.errores), 0)::int AS errores,
              COALESCE(SUM(rt.blancos), 0)::int AS blancos,
              COALESCE(ROUND(AVG(rt.nota), 2), 0) AS nota_media,
              COALESCE(ROUND(AVG(rt.tiempo_segundos), 2), 0) AS tiempo_medio
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'`,
      [userId],
    );
    const row = result.rows[0];
    return {
      totalTests: Number(row.total_tests ?? 0),
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      blancos: Number(row.blancos ?? 0),
      notaMedia: Number(row.nota_media ?? 0),
      tiempoMedio: Number(row.tiempo_medio ?? 0),
    };
  },

  async getTemaStats(userId, temaId) {
    const result = await pool.query(
      `SELECT tema_id,
              preguntas_vistas,
              aciertos,
              errores
       FROM progreso_usuario
       WHERE usuario_id = $1 AND tema_id = $2`,
      [userId, temaId],
    );
    const row = result.rows[0];
    return {
      temaId: Number(row?.tema_id ?? temaId),
      preguntasVistas: Number(row?.preguntas_vistas ?? 0),
      aciertos: Number(row?.aciertos ?? 0),
      errores: Number(row?.errores ?? 0),
    };
  },

  async getRepasoStats(userId, temaId) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS pendientes
       FROM repeticion_espaciada re
       JOIN preguntas p ON p.id = re.pregunta_id
       WHERE re.usuario_id = $1
         AND p.tema_id = $2
         AND re.proxima_revision <= NOW()`,
      [userId, temaId],
    );
    return { pendientes: result.rows[0].pendientes };
  },

  async getDashboard(userId) {
    const result = await pool.query(
      `WITH total_tests AS (
         SELECT COUNT(*)::int AS valor
         FROM tests
         WHERE usuario_id = $1 AND estado = 'finalizado'
       ),
       nota_media AS (
         SELECT COALESCE(ROUND(AVG(rt.nota)::numeric, 1), 0) AS valor
         FROM resultados_test rt
         JOIN tests t ON t.id = rt.test_id
         WHERE t.usuario_id = $1 AND t.estado = 'finalizado'
       ),
       mejor_simulacro AS (
         SELECT COALESCE(MAX(rt.nota), 0) AS valor
         FROM resultados_test rt
         JOIN tests t ON t.id = rt.test_id
         WHERE t.usuario_id = $1
           AND t.tipo_test = 'simulacro'
           AND t.estado = 'finalizado'
       ),
       pendientes_repaso AS (
         SELECT COUNT(*)::int AS valor
         FROM repeticion_espaciada
         WHERE usuario_id = $1 AND proxima_revision <= NOW()
       ),
       total_marcadas AS (
         SELECT COUNT(*)::int AS valor
         FROM preguntas_marcadas
         WHERE usuario_id = $1
       )
       SELECT
         (SELECT valor FROM total_tests)       AS total_tests,
         (SELECT valor FROM nota_media)        AS nota_media,
         (SELECT valor FROM mejor_simulacro)   AS mejor_simulacro,
         (SELECT valor FROM pendientes_repaso) AS pendientes_repaso,
         (SELECT valor FROM total_marcadas)    AS total_marcadas`,
      [userId],
    );
    const r = result.rows[0];
    return {
      totalTests: r.total_tests,
      notaMedia: Number(r.nota_media),
      mejorSimulacro: Number(r.mejor_simulacro),
      pendientesRepaso: r.pendientes_repaso,
      totalMarcadas: r.total_marcadas,
    };
  },

  async getSimulacrosStats(userId, oposicionId) {
    const result = await pool.query(
      `SELECT t.id AS test_id,
              t.fecha_creacion AS fecha,
              t.duracion_segundos,
              rt.nota,
              rt.aciertos,
              rt.errores,
              rt.blancos,
              rt.tiempo_segundos AS tiempo_real_segundos
       FROM tests t
       JOIN resultados_test rt ON rt.test_id = t.id
       WHERE t.usuario_id = $1
         AND t.oposicion_id = $2
         AND t.tipo_test = 'simulacro'
         AND t.estado = 'finalizado'
       ORDER BY t.fecha_creacion DESC`,
      [userId, oposicionId],
    );
    return result.rows.map((r) => ({
      testId: Number(r.test_id),
      fecha: r.fecha,
      nota: Number(r.nota),
      aciertos: r.aciertos,
      errores: r.errores,
      blancos: r.blancos,
      duracionSegundos: r.duracion_segundos,
      tiempoRealSegundos: r.tiempo_real_segundos,
    }));
  },

  async getEvolucion(userId, limit) {
    const result = await pool.query(
      `SELECT fecha_fin::date AS fecha, nota, tipo_test
       FROM (
         SELECT t.fecha_fin, rt.nota, t.tipo_test
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
         ORDER BY t.fecha_fin DESC
         LIMIT $2
       ) sub
       ORDER BY fecha_fin ASC`,
      [userId, limit],
    );
    return result.rows.map((r) => ({
      fecha: r.fecha,
      nota: Number(r.nota),
      tipoTest: r.tipo_test,
    }));
  },

  async getRacha(userId) {
    const [todayResult, daysResult, activity7DaysResult] = await Promise.all([
      pool.query('SELECT CURRENT_DATE::text AS today'),
      pool.query(
        `SELECT DISTINCT rt.fecha::date::text AS dia
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.estado = 'finalizado'
         ORDER BY dia DESC`,
        [userId],
      ),
      pool.query(
        `SELECT gs::date::text AS fecha,
                COALESCE(a.tests, 0)::int AS tests
         FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') gs
         LEFT JOIN (
           SELECT rt.fecha::date AS dia, COUNT(*)::int AS tests
           FROM tests t
           JOIN resultados_test rt ON rt.test_id = t.id
           WHERE t.usuario_id = $1
             AND t.estado = 'finalizado'
             AND rt.fecha::date >= CURRENT_DATE - INTERVAL '6 days'
           GROUP BY rt.fecha::date
         ) a ON a.dia = gs::date
         ORDER BY fecha ASC`,
        [userId],
      ),
    ]);

    const today = todayResult.rows[0].today;
    const todayIndex = toDayIndex(today);
    const dayIndexesDesc = daysResult.rows.map((row) => toDayIndex(row.dia));

    const actividad7Dias = activity7DaysResult.rows.map((row) => ({
      fecha: row.fecha,
      tests: row.tests,
      activo: row.tests > 0,
    }));

    const estudioHoy = actividad7Dias[actividad7Dias.length - 1]?.tests > 0;

    return {
      rachaActual: calcCurrentStreak(dayIndexesDesc, todayIndex),
      mejorRacha: calcBestStreak(dayIndexesDesc),
      estudioHoy,
      actividad7Dias,
    };
  },

  async getRachaTemas(userId) {
    const result = await pool.query(
      `SELECT
         t.tema_id,
         te.nombre AS tema_nombre,
         m.nombre AS materia_nombre,
         (t.fecha_fin::date)::text AS dia
       FROM tests t
       JOIN temas te ON te.id = t.tema_id
       JOIN materias m ON m.id = te.materia_id
       WHERE t.usuario_id = $1
         AND t.estado = 'finalizado'
         AND t.tema_id IS NOT NULL
         AND t.fecha_fin IS NOT NULL
       GROUP BY t.tema_id, te.nombre, m.nombre, t.fecha_fin::date
       ORDER BY t.tema_id, dia DESC`,
      [userId],
    );

    const temasMap = new Map();
    for (const row of result.rows) {
      const key = Number(row.tema_id);
      if (!temasMap.has(key)) {
        temasMap.set(key, {
          temaId: key,
          temaNombre: row.tema_nombre,
          materiaNombre: row.materia_nombre,
          dias: [],
        });
      }
      temasMap.get(key).dias.push(row.dia);
    }

    const today = new Date().toISOString().slice(0, 10);
    const todayIndex = toDayIndex(today);

    return Array.from(temasMap.values())
      .map(({ temaId, temaNombre, materiaNombre, dias }) => {
        const dayIndexes = dias.map(toDayIndex);
        return {
          temaId,
          temaNombre,
          materiaNombre,
          diasActivos: dias.length,
          ultimoDia: dias[0] ?? null,
          rachaActual: calcCurrentStreak(dayIndexes, todayIndex),
        };
      })
      .sort((a, b) => b.rachaActual - a.rachaActual || b.diasActivos - a.diasActivos);
  },

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

  async getProgresoTemasByMateria(userId, materiaId) {
    const result = await pool.query(
      `SELECT
         t.id AS tema_id,
         t.nombre AS tema_nombre,
         m.nombre AS materia_nombre,
         COUNT(DISTINCT p.id)::int AS total_preguntas,
         COALESCE((pu.aciertos + pu.errores), 0)::int AS respondidas,
         COALESCE(pu.aciertos, 0)::int AS aciertos,
         COALESCE(
           ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 1),
           0
         ) AS porcentaje_acierto,
         pu.ultima_practica
       FROM temas t
       JOIN materias m ON m.id = t.materia_id
       LEFT JOIN preguntas p ON p.tema_id = t.id AND p.activo = true
       LEFT JOIN progreso_usuario pu ON pu.tema_id = t.id AND pu.usuario_id = $1
       WHERE t.materia_id = $2
       GROUP BY t.id, t.nombre, m.nombre, pu.aciertos, pu.errores, pu.ultima_practica
       ORDER BY t.nombre ASC`,
      [userId, materiaId],
    );

    return result.rows.map((row) => {
      const totalPreguntas = Number(row.total_preguntas ?? 0);
      const respondidas = Number(row.respondidas ?? 0);
      const maestria = totalPreguntas > 0
        ? Number(((respondidas / totalPreguntas) * 100).toFixed(1))
        : 0;
      return {
        temaId: Number(row.tema_id),
        temaNombre: row.tema_nombre,
        materiaNombre: row.materia_nombre,
        totalPreguntas,
        respondidas,
        aciertos: Number(row.aciertos ?? 0),
        maestria,
        porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
        ultimaPractica: row.ultima_practica ?? null,
      };
    });
  },

  async getDetalleTema(userId, temaId) {
    const [progresoResult, historialResult] = await Promise.all([
      pool.query(
        `SELECT
           t.id AS tema_id,
           t.nombre AS tema_nombre,
           m.id AS materia_id,
           m.nombre AS materia_nombre,
           o.id AS oposicion_id,
           o.nombre AS oposicion_nombre,
           COUNT(DISTINCT p.id)::int AS total_preguntas,
           COALESCE(pu.aciertos, 0)::int AS aciertos,
           COALESCE(pu.errores, 0)::int AS errores,
           COALESCE((pu.aciertos + pu.errores), 0)::int AS respondidas,
           COALESCE(
             ROUND((pu.aciertos::numeric / NULLIF(pu.aciertos + pu.errores, 0)) * 100, 1),
             0
           ) AS porcentaje_acierto,
           pu.ultima_practica
         FROM temas t
         JOIN materias m ON m.id = t.materia_id
         JOIN oposiciones o ON o.id = m.oposicion_id
         LEFT JOIN preguntas p ON p.tema_id = t.id AND p.activo = true
         LEFT JOIN progreso_usuario pu ON pu.tema_id = t.id AND pu.usuario_id = $1
         WHERE t.id = $2
         GROUP BY t.id, t.nombre, m.id, m.nombre, o.id, o.nombre, pu.aciertos, pu.errores, pu.ultima_practica`,
        [userId, temaId],
      ),
      pool.query(
        `SELECT t.id AS test_id, t.fecha_creacion, t.tipo_test,
                rt.aciertos, rt.errores, rt.blancos, rt.nota, rt.tiempo_segundos
         FROM tests t
         JOIN resultados_test rt ON rt.test_id = t.id
         WHERE t.usuario_id = $1
           AND t.tema_id = $2
           AND t.estado = 'finalizado'
         ORDER BY t.fecha_creacion DESC
         LIMIT 5`,
        [userId, temaId],
      ),
    ]);

    if (progresoResult.rows.length === 0) return null;

    const row = progresoResult.rows[0];
    const totalPreguntas = Number(row.total_preguntas ?? 0);
    const respondidas = Number(row.respondidas ?? 0);
    const maestria = totalPreguntas > 0
      ? Number(((respondidas / totalPreguntas) * 100).toFixed(1))
      : 0;

    return {
      temaId: Number(row.tema_id),
      temaNombre: row.tema_nombre,
      materiaId: Number(row.materia_id),
      materiaNombre: row.materia_nombre,
      oposicionId: Number(row.oposicion_id),
      oposicionNombre: row.oposicion_nombre,
      totalPreguntas,
      respondidas,
      aciertos: Number(row.aciertos ?? 0),
      errores: Number(row.errores ?? 0),
      maestria,
      porcentajeAcierto: Number(row.porcentaje_acierto ?? 0),
      ultimaPractica: row.ultima_practica ?? null,
      ultimosTests: historialResult.rows.map((h) => ({
        testId: Number(h.test_id),
        fecha: h.fecha_creacion,
        tipoTest: h.tipo_test,
        aciertos: Number(h.aciertos ?? 0),
        errores: Number(h.errores ?? 0),
        blancos: Number(h.blancos ?? 0),
        nota: Number(h.nota ?? 0),
        tiempoSegundos: Number(h.tiempo_segundos ?? 0),
      })),
    };
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

  async getMisOposiciones(userId) {
    const result = await pool.query(
      `SELECT
         o.id AS oposicion_id,
         o.nombre,
         COUNT(DISTINCT p.id)::int AS total_preguntas,
         COALESCE(SUM(pu.aciertos + pu.errores), 0)::int AS respondidas,
         COALESCE(SUM(pu.aciertos), 0)::int AS aciertos,
         COUNT(DISTINCT t2.id) FILTER (WHERE t2.estado = 'finalizado')::int AS tests_realizados,
         MAX(rt.fecha) AS ultima_practica
       FROM oposiciones o
       JOIN materias m ON m.oposicion_id = o.id
       JOIN temas tm ON tm.materia_id = m.id
       LEFT JOIN preguntas p ON p.tema_id = tm.id AND p.activo = true
       LEFT JOIN progreso_usuario pu ON pu.tema_id = tm.id AND pu.usuario_id = $1
       LEFT JOIN tests t2 ON t2.usuario_id = $1 AND t2.oposicion_id = o.id
       LEFT JOIN resultados_test rt ON rt.test_id = t2.id
       WHERE EXISTS (
         SELECT 1 FROM tests t3
         WHERE t3.usuario_id = $1
           AND t3.oposicion_id = o.id
           AND t3.estado = 'finalizado'
       )
       GROUP BY o.id, o.nombre
       ORDER BY MAX(rt.fecha) DESC NULLS LAST`,
      [userId],
    );

    return result.rows.map((row) => {
      const totalPreguntas = Number(row.total_preguntas ?? 0);
      const respondidas = Number(row.respondidas ?? 0);
      const maestria = totalPreguntas > 0
        ? Number(((respondidas / totalPreguntas) * 100).toFixed(1))
        : 0;
      return {
        oposicionId: Number(row.oposicion_id),
        nombre: row.nombre,
        totalPreguntas,
        respondidas,
        aciertos: Number(row.aciertos ?? 0),
        maestria,
        testsRealizados: Number(row.tests_realizados ?? 0),
        ultimaPractica: row.ultima_practica ?? null,
      };
    });
  },
};