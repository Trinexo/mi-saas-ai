import { testSubmitPostProcessService } from './testSubmitPostProcess.service.js';
import { albacerProgressService } from './albacerProgress.service.js';

export const testSubmitOrchestratorFinalizeService = {
  async finalizeSubmit({ userId, result }) {
    testSubmitPostProcessService.runSpacedRepetition({
      userId,
      respuestasEvaluadas: result.respuestasEvaluadas,
    });

    const albacer = await albacerProgressService.processFinalAttempt({
      userId,
      testId: result.testId,
      aciertos: result.aciertos,
      nota: result.nota,
    });

    const response = testSubmitPostProcessService.buildSubmitResponse(result);
    return albacer ? { ...response, albacer } : response;
  },
};
