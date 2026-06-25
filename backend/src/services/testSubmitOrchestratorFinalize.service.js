import { testSubmitPostProcessService } from './testSubmitPostProcess.service.js';
import { albacerProgressService } from './albacerProgress.service.js';

export const testSubmitOrchestratorFinalizeService = {
  async finalizeSubmit({ userId, result }) {
    testSubmitPostProcessService.runSpacedRepetition({
      userId,
      respuestasEvaluadas: result.respuestasEvaluadas,
    });

    const response = testSubmitPostProcessService.buildSubmitResponse(result);
    const isAlbacerAttempt = result.testContext?.modo_preparacion === 'albacer'
      && result.testContext?.albacer_item_id;
    if (!isAlbacerAttempt) return response;

    const albacer = await albacerProgressService.processFinalAttempt({
      userId,
      testId: result.testId,
      aciertos: result.aciertos,
      nota: result.nota,
    });

    return albacer ? { ...response, albacer } : response;
  },
};
