import { testSubmitTransactionalService } from './testSubmitTransactional.service.js';

export const testSubmitOrchestratorExecutionService = {
  async executeSubmit({ userId, testId, respuestas = [], tiempoSegundos }) {
    return testSubmitTransactionalService.submitTransactional({
      userId,
      testId,
      respuestas,
      tiempoSegundos,
    });
  },
};