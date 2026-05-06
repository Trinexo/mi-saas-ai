import pool from '../config/db.js';
import { spacedRepetitionRepository } from './spacedRepetition.repository.js';

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
        `SELECT p.bloque_id, COUNT(*)::int AS total
         FROM repeticion_espaciada re
         JOIN preguntas p ON p.id = re.pregunta_id
         WHERE re.usuario_id = $1
           AND re.proxima_revision <= NOW()
         GROUP BY p.bloque_id
         ORDER BY total DESC, p.bloque_id ASC
         LIMIT 1`,
        [userId],
      ),
      pool.query(
        `SELECT re.pregunta_id,
                re.proxima_revision,
                p.bloque_id,
                bl.nombre AS bloque_nombre,
                t.nombre AS tema_nombre
         FROM repeticion_espaciada re
         JOIN preguntas p ON p.id = re.pregunta_id
         JOIN bloques bl ON bl.id = p.bloque_id
         JOIN temas t ON t.id = bl.tema_id
         WHERE re.usuario_id = $1
           AND re.proxima_revision <= NOW()
         ORDER BY re.proxima_revision ASC
         LIMIT $2`,
        [userId, limit],
      ),
    ]);

    return {
      totalPendientes: totalResult.rows[0]?.total ?? 0,
      bloqueIdSugerido: sugeridoResult.rowCount > 0 ? Number(sugeridoResult.rows[0].bloque_id) : null,
      items: itemsResult.rows.map((row) => ({
        preguntaId: Number(row.pregunta_id),
        bloqueId: Number(row.bloque_id),
        bloqueNombre: row.bloque_nombre,
        temaNombre: row.tema_nombre,
        proximaRevision: row.proxima_revision,
      })),
    };
  },

  /**
   * Delega en spacedRepetitionRepository para reutilizar el algoritmo SM-2 centralizado.
   * respuestas: Array<{ preguntaId: number, acertada: boolean }>
   */
  async actualizarBatch(userId, respuestas) {
    if (!respuestas || !respuestas.length) return;
    for (const { preguntaId, acertada } of respuestas) {
      await spacedRepetitionRepository.upsertRepaso({ userId, preguntaId, correcta: acertada });
    }
  },
};
