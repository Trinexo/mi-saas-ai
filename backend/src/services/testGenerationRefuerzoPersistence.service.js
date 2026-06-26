import { testRepository } from '../repositories/test.repository.js';

export const testGenerationRefuerzoPersistenceService = {
  async persistRefuerzoTest({ userId, temaId, oposicionId, preguntas }) {
    const test = await testRepository.createTest({
      userId,
      temaId: temaId || null,
      oposicionId: oposicionId || null,
      tipoTest: 'refuerzo',
      numeroPreguntas: preguntas.length,
      duracionSegundos: null,
    });
    await testRepository.insertTestPreguntas(test.id, preguntas.map((item) => item.id));

    return {
      testId: test.id,
      temaId: temaId || null,
      oposicionId: oposicionId || null,
      numeroPreguntas: preguntas.length,
      modo: 'refuerzo',
      dificultad: 'mixto',
      duracionSegundos: null,
      preguntas,
    };
  },
};
