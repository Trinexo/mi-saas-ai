// Barrel de compatibilidad - los metodos se han dividido en testSubmit y testQuery.
import { testSubmitService } from './testSubmit.service.js';
import { testQueryService } from './testQuery.service.js';

export const testEvaluationService = { ...testSubmitService, ...testQueryService };
export { testSubmitService, testQueryService };
