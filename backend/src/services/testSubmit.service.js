// Barrel de compatibilidad - los metodos se han dividido en testSubmitOrchestrator, testSubmitTransactional y testSubmitPostProcess.
import { testSubmitOrchestratorService } from './testSubmitOrchestrator.service.js';
import { testSubmitTransactionalService } from './testSubmitTransactional.service.js';
import { testSubmitPostProcessService } from './testSubmitPostProcess.service.js';

export const testSubmitService = {
  ...testSubmitOrchestratorService,
  ...testSubmitTransactionalService,
  ...testSubmitPostProcessService,
};

export { testSubmitOrchestratorService, testSubmitTransactionalService, testSubmitPostProcessService };
