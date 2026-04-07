// Barrel de compatibilidad - los metodos se han dividido en testSessionDetailReview y testSessionDetailConfig.
import { testSessionDetailReviewRepository } from './testSessionDetailReview.repository.js';
import { testSessionDetailConfigRepository } from './testSessionDetailConfig.repository.js';

export const testSessionDetailRepository = { ...testSessionDetailReviewRepository, ...testSessionDetailConfigRepository };
export { testSessionDetailReviewRepository, testSessionDetailConfigRepository };
