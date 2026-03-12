import { statsRepository } from '../repositories/stats.repository.js';
import { ApiError } from '../utils/api-error.js';

export const statsService = {
  async getUserStats(userId) {
    return statsRepository.getUserStats(userId);
  },

  async getTemaStats(userId, temaId) {
    if (!Number.isFinite(temaId)) {
      throw new ApiError(400, 'tema_id es obligatorio');
    }

    return statsRepository.getTemaStats(userId, temaId);
  },
};