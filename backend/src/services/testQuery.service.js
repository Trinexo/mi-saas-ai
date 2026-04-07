import { ApiError } from '../utils/api-error.js';
import { testRepository } from '../repositories/test.repository.js';

export const testQueryService = {
  async getHistory({ userId, limit = 20, page = 1, oposicionId, desde, hasta }) {
    return testRepository.getUserHistory({ userId, limit, page, oposicionId, desde, hasta });
  },

  async getReview({ userId, testId }) {
    const data = await testRepository.getTestReview(userId, testId);
    if (!data) throw new ApiError(404, 'Test no encontrado');
    return data;
  },

  async getConfig({ userId, testId }) {
    const data = await testRepository.getTestConfig(userId, testId);
    if (!data) throw new ApiError(404, 'Test no encontrado');
    return data;
  },
};
