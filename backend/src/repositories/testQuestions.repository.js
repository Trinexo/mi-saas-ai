// Barrel de compatibilidad - los metodos se han dividido en testQuestionsStandard, testQuestionsAdaptive y testQuestionsSpecial.
import { testQuestionsStandardRepository } from './testQuestionsStandard.repository.js';
import { testQuestionsAdaptiveRepository } from './testQuestionsAdaptive.repository.js';
import { testQuestionsSpecialRepository } from './testQuestionsSpecial.repository.js';

export const testQuestionsRepository = {
  ...testQuestionsStandardRepository,
  ...testQuestionsAdaptiveRepository,
  ...testQuestionsSpecialRepository,
};

export { testQuestionsStandardRepository, testQuestionsAdaptiveRepository, testQuestionsSpecialRepository };
