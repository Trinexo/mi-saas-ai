import { progressStatsRepository } from '../repositories/progressStats.repository.js';
import { ApiError } from '../utils/api-error.js';

export const statsProgresoDetalleOposicionService = {
  async getSimulacrosStats(userId, oposicionId, options = {}) {
    if (!Number.isInteger(oposicionId) || oposicionId <= 0)
      throw new ApiError(400, 'oposicion_id debe ser un entero positivo');
    return progressStatsRepository.getSimulacrosStats(userId, oposicionId, options);
  },

  async getResumenOposicion(userId, oposicionId) {
    if (!Number.isInteger(oposicionId) || oposicionId <= 0)
      throw new ApiError(400, 'oposicion_id debe ser un entero positivo');
    return progressStatsRepository.getResumenOposicion(userId, oposicionId);
  },

  async getProgresoMaterias(userId, oposicionId) {
    if (!Number.isInteger(oposicionId) || oposicionId <= 0)
      throw new ApiError(400, 'oposicion_id debe ser un entero positivo');
    return progressStatsRepository.getProgresoMaterias(userId, oposicionId);
  },
};
