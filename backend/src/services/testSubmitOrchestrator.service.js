import { testSubmitOrchestratorExecutionService } from './testSubmitOrchestratorExecution.service.js';
import { testSubmitOrchestratorFinalizeService } from './testSubmitOrchestratorFinalize.service.js';

export const testSubmitOrchestratorService = {
  async submit({ userId, testId, respuestas = [], tiempoSegundos }) {
    const result = await testSubmitOrchestratorExecutionService.executeSubmit({
      userId,
      testId,
      respuestas,
      tiempoSegundos,
    });

    return testSubmitOrchestratorFinalizeService.finalizeSubmit({ userId, result });
  },
};