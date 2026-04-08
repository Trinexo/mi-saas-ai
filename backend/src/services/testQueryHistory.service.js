import { testRepository } from '../repositories/test.repository.js';

export const testQueryHistoryService = {
  async getHistory({ userId, limit = 20, page = 1, oposicionId, desde, hasta }) {
    return testRepository.getUserHistory({ userId, limit, page, oposicionId, desde, hasta });
  },
};
