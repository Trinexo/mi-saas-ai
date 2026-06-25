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

    const scoring = testSubmitScoringService.evaluateRespuestas({
      respuestas,
      mapaRespuestasCorrectas,
      scoringSnapshot: test.scoring_snapshot ?? null,
    });

    return {
      ...scoring,
      testContext: {
        modo_preparacion: test.modo_preparacion ?? 'experto',
        albacer_modulo_id: test.albacer_modulo_id ?? null,
        albacer_item_id: test.albacer_item_id ?? null,
        scoring_snapshot: test.scoring_snapshot ?? null,
      },
    };
  },
};
