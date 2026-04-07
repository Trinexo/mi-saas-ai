import { progressStatsRepository } from '../repositories/progressStats.repository.js';
import { ApiError } from '../utils/api-error.js';

export const statsProgresoDetalleService = {
  async getTemaStats(userId, temaId) {
    if (!Number.isInteger(temaId) || temaId <= 0)
      throw new ApiError(400, 'tema_id debe ser un entero positivo');
    return progressStatsRepository.getTemaStats(userId, temaId);
  },

  async getRepasoStats(userId, temaId) {
    if (!Number.isInteger(temaId) || temaId <= 0)
      throw new ApiError(400, 'tema_id debe ser un entero positivo');
    return progressStatsRepository.getRepasoStats(userId, temaId);
  },

  async getSimulacrosStats(userId, oposicionId) {
    if (!Number.isInteger(oposicionId) || oposicionId <= 0)
      throw new ApiError(400, 'oposicion_id debe ser un entero positivo');
    return progressStatsRepository.getSimulacrosStats(userId, oposicionId);
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

  async getProgresoTemasByMateria(userId, materiaId) {
    if (!Number.isInteger(materiaId) || materiaId <= 0)
      throw new ApiError(400, 'materia_id debe ser un entero positivo');
    return progressStatsRepository.getProgresoTemasByMateria(userId, materiaId);
  },

  async getDetalleTema(userId, temaId) {
    if (!Number.isInteger(temaId) || temaId <= 0)
      throw new ApiError(400, 'tema_id debe ser un entero positivo');
    const data = await progressStatsRepository.getDetalleTema(userId, temaId);
    if (!data) throw new ApiError(404, 'Tema no encontrado');
    return data;
  },
};
