import { testSubmitPostProcessService } from './testSubmitPostProcess.service.js';

export const testSubmitOrchestratorFinalizeService = {
  finalizeSubmit({ userId, result }) {
    testSubmitPostProcessService.runSpacedRepetition({
      userId,
      respuestasEvaluadas: result.respuestasEvaluadas,
    });

    return testSubmitPostProcessService.buildSubmitResponse(result);
  },
};