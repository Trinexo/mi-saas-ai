import { testGenerationGenerateSelectionService } from './testGenerationGenerateSelection.service.js';
import { testGenerationGenerateSelectionMixtoService } from './testGenerationGenerateSelectionMixto.service.js';
import { testGenerationGeneratePersistenceService } from './testGenerationGeneratePersistence.service.js';

export const testGenerationGenerateOrchestratorService = {
  async generate({ userId, temaId, temasMix, oposicionId, numeroPreguntas, modo = 'adaptativo', dificultad = 'mixto', duracionSegundos, feedbackInmediato = false }) {
    let preguntas;

    if (temasMix && temasMix.length > 0) {
      preguntas = await testGenerationGenerateSelectionMixtoService.pickMixto({
        userId,
        temasMix,
        numeroPreguntas,
        modo,
        dificultad,
      });
    } else {
      preguntas = await testGenerationGenerateSelectionService.selectPreguntas({
        userId,
        temaId,
        oposicionId,
        numeroPreguntas,
        modo,
        dificultad,
      });
    }

    return testGenerationGeneratePersistenceService.persistAndBuildResponse({
      userId,
      temaId: temasMix ? null : temaId,
      oposicionId,
      modo,
      dificultad,
      duracionSegundos,
      feedbackInmediato,
      preguntas,
    });
  },
};