import { rankingRepository } from '../repositories/ranking.repository.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { ApiError } from '../utils/api-error.js';

export const rankingService = {
  /**
   * Devuelve el ranking de la oposición activa del usuario.
   *
   * Respuesta:
   * {
   *   miScore: { rendimiento, actividad, evolucion, score, testsRealizados },
   *   miPosicion: number | null,
   *   totalParticipantes: number,
   *   percentilSuperado: number,   // % de usuarios que supero
   *   top: [ { posicion, alias, rendimiento, testsRealizados, score, isMe } ]
   * }
   */
  async getRanking(userId, oposicionId) {
    if (!oposicionId) throw new ApiError(400, 'Se requiere oposicion_id');

    const acceso = await accesoOposicionRepository.getPreparacion(userId, oposicionId);
    if (!acceso) throw new ApiError(403, 'No tienes acceso a esa oposicion');

    const [miScore, top, totalParticipantes] = await Promise.all([
      rankingRepository.getUserScore(userId, oposicionId),
      rankingRepository.getTopByOposicion(oposicionId, userId, 10),
      rankingRepository.countParticipantes(oposicionId),
    ]);

    const meInTop = top.find((r) => r.isMe);
    const miPosicion = meInTop ? meInTop.posicion : null;

    const percentilSuperado = totalParticipantes > 1 && miPosicion
      ? Math.round(((totalParticipantes - miPosicion) / totalParticipantes) * 100)
      : 0;

    return {
      miScore,
      miPosicion,
      totalParticipantes,
      percentilSuperado,
      rankingPublico: Boolean(acceso.ranking_publico),
      top,
    };
  },
};
