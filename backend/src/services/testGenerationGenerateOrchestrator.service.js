import { testGenerationGenerateSelectionService } from './testGenerationGenerateSelection.service.js';
import { testGenerationGeneratePersistenceService } from './testGenerationGeneratePersistence.service.js';

export const testGenerationGenerateOrchestratorService = {
  async generate({ userId, temaId, oposicionId, numeroPreguntas, modo = 'adaptativo', dificultad = 'mixto', duracionSegundos, feedbackInmediato = false }) {
    const preguntas = await testGenerationGenerateSelectionService.selectPreguntas({
      userId,
      temaId,
      oposicionId,
      numeroPreguntas,
      modo,
      dificultad,
    });

    return testGenerationGeneratePersistenceService.persistAndBuildResponse({
      userId,
      temaId,
      oposicionId,
      modo,
      dificultad,
      duracionSegundos,
      feedbackInmediato,
      preguntas,
    });
  },
};