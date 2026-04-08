// Barrel de compatibilidad - los metodos se han dividido en testQueryHistory y testQueryDetail.
import { testQueryHistoryService } from './testQueryHistory.service.js';
import { testQueryDetailService } from './testQueryDetail.service.js';

export const testQueryService = {
  ...testQueryHistoryService,
  ...testQueryDetailService,
};

export { testQueryHistoryService, testQueryDetailService };
