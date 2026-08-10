import { rankingRepository } from '../repositories/ranking.repository.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { accessContextService } from './accessContext.service.js';
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

    const contexto = await accessContextService.obtenerContextoUsuario({
      usuarioId: userId,
      oposicionId,
      principal: { tipo: 'alumno', usuarioId: userId },
    });
    if (!contexto.tiene_acceso) throw new ApiError(403, 'No tienes acceso a esa oposicion');
    if (!contexto.permisos.puede_acceder_contenido || !contexto.permisos.puede_usar_experto) {
      throw new ApiError(403, 'El ranking solo esta disponible en Modo Experto');
    }
    const legacy = await accesoOposicionRepository.obtenerDatosLegacyAcceso(userId, oposicionId);

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
      rankingPublico: Boolean(legacy?.ranking_publico),
      top,
    };
  },
};
