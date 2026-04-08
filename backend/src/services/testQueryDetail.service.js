import { ApiError } from '../utils/api-error.js';
import { testRepository } from '../repositories/test.repository.js';

export const testQueryDetailService = {
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
