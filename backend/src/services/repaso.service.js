import { repasoRepository } from '../repositories/repaso.repository.js';

export const repasoService = {
  async getPendientes(userId, limit = 20) {
    return repasoRepository.getPendientes(userId, limit);
  },
};
