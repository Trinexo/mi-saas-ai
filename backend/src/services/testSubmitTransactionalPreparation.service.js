import { testRepository } from '../repositories/test.repository.js';
import { testSubmitValidationService } from './testSubmitValidation.service.js';
import { testSubmitScoringService } from './testSubmitScoring.service.js';

export const testSubmitTransactionalPreparationService = {
  async prepareSubmission({ client, userId, testId, respuestas = [] }) {
    const test = await testRepository.getTestById(client, testId);
    testSubmitValidationService.assertTestExistsAndOwner(test, userId);
    testSubmitValidationService.assertTestNotFinalized(test);

    const mapaRespuestasCorrectas = await testRepository.getCorrectAnswersByTest(client, testId);
    const uniquePreguntaIds = testSubmitValidationService.assertNoDuplicateRespuestas(respuestas);
    testSubmitValidationService.assertPreguntasBelongToTest(uniquePreguntaIds, mapaRespuestasCorrectas);

    return testSubmitScoringService.evaluateRespuestas({
      respuestas,
      mapaRespuestasCorrectas,
    });
  },
};