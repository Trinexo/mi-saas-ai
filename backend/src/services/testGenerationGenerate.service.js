// Barrel de compatibilidad - los metodos se han dividido en testGenerationGenerateOrchestrator, testGenerationGenerateSelection y testGenerationGeneratePersistence.
import { testGenerationGenerateOrchestratorService } from './testGenerationGenerateOrchestrator.service.js';
import { testGenerationGenerateSelectionService } from './testGenerationGenerateSelection.service.js';
import { testGenerationGeneratePersistenceService } from './testGenerationGeneratePersistence.service.js';

export const testGenerationGenerateService = {
  ...testGenerationGenerateOrchestratorService,
  ...testGenerationGenerateSelectionService,
  ...testGenerationGeneratePersistenceService,
};

export {
  testGenerationGenerateOrchestratorService,
  testGenerationGenerateSelectionService,
  testGenerationGeneratePersistenceService,
};
