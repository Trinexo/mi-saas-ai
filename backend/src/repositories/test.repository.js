// Barrel de compatibilidad — los metodos se han dividido en testQuestions y testSession.
import { testQuestionsRepository } from './testQuestions.repository.js';
import { testSessionRepository } from './testSession.repository.js';

export const testRepository = {
  ...testQuestionsRepository,
  ...testSessionRepository,
};

export { testQuestionsRepository, testSessionRepository };
