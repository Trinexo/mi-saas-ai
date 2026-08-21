import { ApiError } from '../utils/api-error.js';
import { testRepository } from '../repositories/test.repository.js';
import { testGenerationGenerateSelectionEspecialService } from './testGenerationGenerateSelectionEspecial.service.js';
import { testGenerationGenerateSelectionAdaptativoService } from './testGenerationGenerateSelectionAdaptativo.service.js';

export const testGenerationGenerateSelectionService = {
  async selectPreguntas({ userId, temaId, bloqueId, oposicionId, numeroPreguntas, modo = 'adaptativo', dificultad = 'mixto', officialidad = 'all', anioExamen = null, anioIds = [], examenId = null }) {
    let preguntas = await testGenerationGenerateSelectionEspecialService.pickEspecial({
      userId, oposicionId, temaId, bloqueId, numeroPreguntas, modo, officialidad, anio: anioExamen, anioIds, examenId,
    });

    if (preguntas === null) {
      preguntas = await testGenerationGenerateSelectionAdaptativoService.pickAdaptativo({
        userId, temaId, numeroPreguntas, modo, dificultad, officialidad, anio: anioExamen, anioIds, examenId,
      });
    }

    if (preguntas.length < numeroPreguntas && !['simulacro', 'marcadas', 'repaso'].includes(modo) && temaId) {
      const excludeIds = preguntas.map((pregunta) => pregunta.id);
      const extra = await testRepository.pickAnyQuestions({
        userId,
        temaId,
        numeroPreguntas: numeroPreguntas - preguntas.length,
        excludePreguntaIds: excludeIds,
        officialidad,
        anio: anioExamen,
        anioIds,
        examenId,
      });
      preguntas = [...preguntas, ...extra];

      if (preguntas.length < numeroPreguntas) {
        throw new ApiError(400, 'No hay preguntas suficientes para generar el test con el criterio solicitado');
      }
    }

    if (preguntas.length === 0) {
      if (modo === 'repaso') return [];
      throw new ApiError(400, 'No hay preguntas disponibles para el test');
    }

    return preguntas;
  },
};
