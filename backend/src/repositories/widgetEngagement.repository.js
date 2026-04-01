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

export const widgetEngagementRepository = {
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
};
