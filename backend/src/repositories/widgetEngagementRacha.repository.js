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

export const widgetEngagementRachaRepository = {
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
