import { testRepository } from '../repositories/test.repository.js';

export const testGenerationGenerateSelectionEspecialService = {
  async pickEspecial({ userId, oposicionId, temaId, bloqueId, numeroPreguntas, modo, officialidad = 'all', anio = null, anioIds = [], examenId = null }) {
    if (modo === 'marcadas') {
      return testRepository.pickMarcadasQuestions({ userId, oposicionId, numeroPreguntas, officialidad, anio, anioIds, examenId });
    }

    if (modo === 'simulacro') {
      return testRepository.pickSimulacroQuestions({ oposicionId, numeroPreguntas, officialidad, anio, anioIds, examenId });
    }

    if (modo === 'repaso') {
      return testRepository.pickDueQuestions({ userId, temaId, bloqueId, oposicionId, numeroPreguntas, officialidad, anio, anioIds, examenId });
    }

    if (!temaId && oposicionId) {
      return testRepository.pickSimulacroQuestions({ oposicionId, numeroPreguntas, officialidad, anio, anioIds, examenId });
    }

    return null;
  },
};
