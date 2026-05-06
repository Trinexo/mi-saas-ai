import { progressStatsRepository } from '../repositories/progressStats.repository.js';
import { ApiError } from '../utils/api-error.js';

export const statsProgresoDetalleTemaService = {
  async getBloqueStats(userId, bloqueId) {
    if (!Number.isInteger(bloqueId) || bloqueId <= 0)
      throw new ApiError(400, 'bloque_id debe ser un entero positivo');
    return progressStatsRepository.getBloqueStats(userId, bloqueId);
  },

  async getRepasoStats(userId, bloqueId) {
    if (!Number.isInteger(bloqueId) || bloqueId <= 0)
      throw new ApiError(400, 'bloque_id debe ser un entero positivo');
    return progressStatsRepository.getRepasoStats(userId, bloqueId);
  },

  async getProgresoBloquesByTema(userId, temaId) {
    if (!Number.isInteger(temaId) || temaId <= 0)
      throw new ApiError(400, 'tema_id debe ser un entero positivo');
    return progressStatsRepository.getProgresoBloquesByTema(userId, temaId);
  },

  async getDetalleBloque(userId, bloqueId) {
    if (!Number.isInteger(bloqueId) || bloqueId <= 0)
      throw new ApiError(400, 'bloque_id debe ser un entero positivo');
    const data = await progressStatsRepository.getDetalleBloque(userId, bloqueId);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },
};