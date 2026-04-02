// Barrel de compatibilidad - los metodos se han dividido en testSessionHistory y testSessionDetail.
import { testSessionHistoryRepository } from './testSessionHistory.repository.js';
import { testSessionDetailRepository } from './testSessionDetail.repository.js';

export const testSessionReadRepository = { ...testSessionHistoryRepository, ...testSessionDetailRepository };
export { testSessionHistoryRepository, testSessionDetailRepository };
