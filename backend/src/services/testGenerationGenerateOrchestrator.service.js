import { testGenerationGenerateSelectionService } from './testGenerationGenerateSelection.service.js';
import { testGenerationGenerateSelectionMixtoService } from './testGenerationGenerateSelectionMixto.service.js';
import { testGenerationGeneratePersistenceService } from './testGenerationGeneratePersistence.service.js';

export const testGenerationGenerateOrchestratorService = {
  async generate({ userId, temaId, bloqueId, temasMix, oposicionId, numeroPreguntas, modo = 'adaptativo', dificultad = 'mixto', duracionSegundos, feedbackInmediato = false }) {
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
        bloqueId,
        oposicionId,
        numeroPreguntas,
        modo,
        dificultad,
      });
    }

    if (!preguntas || preguntas.length === 0) return null;

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
