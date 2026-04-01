// Barrel de compatibilidad - los metodos se han dividido en testQuestionsStandard y testQuestionsAdaptive.
import { testQuestionsStandardRepository } from './testQuestionsStandard.repository.js';
import { testQuestionsAdaptiveRepository } from './testQuestionsAdaptive.repository.js';

export const testQuestionsRepository = {
  ...testQuestionsStandardRepository,
  ...testQuestionsAdaptiveRepository,
};

export { testQuestionsStandardRepository, testQuestionsAdaptiveRepository };
