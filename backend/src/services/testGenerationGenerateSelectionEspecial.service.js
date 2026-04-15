import { testRepository } from '../repositories/test.repository.js';

export const testGenerationGenerateSelectionEspecialService = {
  async pickEspecial({ userId, oposicionId, temaId, numeroPreguntas, modo }) {
    if (modo === 'marcadas') {
      return testRepository.pickMarcadasQuestions({ userId, numeroPreguntas });
    }

    if (modo === 'simulacro') {
      return testRepository.pickSimulacroQuestions({ oposicionId, numeroPreguntas });
    }

    if (modo === 'repaso') {
      return testRepository.pickDueQuestions({ userId, temaId, numeroPreguntas });
    }

    if (!temaId && oposicionId) {
      return testRepository.pickSimulacroQuestions({ oposicionId, numeroPreguntas });
    }

    return null;
  },
};
