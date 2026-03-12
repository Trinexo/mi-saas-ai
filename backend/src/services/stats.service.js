import { statsRepository } from '../repositories/stats.repository.js';
import { ApiError } from '../utils/api-error.js';

export const statsService = {
  async getUserStats(userId) {
    return statsRepository.getUserStats(userId);
  },

  async getTemaStats(userId, temaId) {
    if (!Number.isInteger(temaId) || temaId <= 0) {
      throw new ApiError(400, 'tema_id debe ser un entero positivo');
    }

    return statsRepository.getTemaStats(userId, temaId);
  },
};