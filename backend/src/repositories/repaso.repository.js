import pool from '../config/db.js';

export const repasoRepository = {
  async getPendientes(userId, limit = 20) {
    const [totalResult, sugeridoResult, itemsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM repeticion_espaciada
         WHERE usuario_id = $1
           AND proxima_revision <= NOW()`,
        [userId],
      ),
      pool.query(
        `SELECT p.tema_id, COUNT(*)::int AS total
         FROM repeticion_espaciada re
         JOIN preguntas p ON p.id = re.pregunta_id
         WHERE re.usuario_id = $1
           AND re.proxima_revision <= NOW()
         GROUP BY p.tema_id
         ORDER BY total DESC, p.tema_id ASC
         LIMIT 1`,
        [userId],
      ),
      pool.query(
        `SELECT re.pregunta_id,
                re.proxima_revision,
                p.tema_id,
                t.nombre AS tema_nombre,
                m.nombre AS materia_nombre
         FROM repeticion_espaciada re
         JOIN preguntas p ON p.id = re.pregunta_id
         JOIN temas t ON t.id = p.tema_id
         JOIN materias m ON m.id = t.materia_id
         WHERE re.usuario_id = $1
           AND re.proxima_revision <= NOW()
         ORDER BY re.proxima_revision ASC
         LIMIT $2`,
        [userId, limit],
      ),
    ]);

    return {
      totalPendientes: totalResult.rows[0]?.total ?? 0,
      temaIdSugerido: sugeridoResult.rowCount > 0 ? Number(sugeridoResult.rows[0].tema_id) : null,
      items: itemsResult.rows.map((row) => ({
        preguntaId: Number(row.pregunta_id),
        temaId: Number(row.tema_id),
        temaNombre: row.tema_nombre,
        materiaNombre: row.materia_nombre,
        proximaRevision: row.proxima_revision,
      })),
    };
  },
};
