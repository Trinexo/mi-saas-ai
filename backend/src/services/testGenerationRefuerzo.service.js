// Barrel de compatibilidad - los metodos se han dividido en testGenerationRefuerzoSelection y testGenerationRefuerzoPersistence.
import { testGenerationRefuerzoSelectionService } from './testGenerationRefuerzoSelection.service.js';
import { testGenerationRefuerzoPersistenceService } from './testGenerationRefuerzoPersistence.service.js';

export const testGenerationRefuerzoService = {
  async generateRefuerzo(params) {
    const preguntas = await testGenerationRefuerzoSelectionService.selectPreguntasRefuerzo(params);
    return testGenerationRefuerzoPersistenceService.persistRefuerzoTest({
      userId: params.userId,
      temaId: params.temaId,
      preguntas,
    });
  },
  ...testGenerationRefuerzoSelectionService,
  ...testGenerationRefuerzoPersistenceService,
};

export { testGenerationRefuerzoSelectionService, testGenerationRefuerzoPersistenceService };
