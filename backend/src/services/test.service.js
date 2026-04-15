// Barrel de compatibilidad - los metodos se han dividido en testGeneration y testEvaluation.
import { testGenerationService } from './testGeneration.service.js';
import { testEvaluationService } from './testEvaluation.service.js';
import { testQueryService } from './testQuery.service.js';

export const testService = {
  ...testGenerationService,
  ...testEvaluationService,
  ...testQueryService,
};

export { testGenerationService, testEvaluationService };