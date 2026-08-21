import { testRepository } from '../repositories/test.repository.js';
import { orderOptions } from '../utils/test-option-order.js';

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
    const optionOrders = (await testRepository.insertTestPreguntas(test.id, preguntas.map((item) => item.id))) ?? [];
    const orderByQuestion = new Map(optionOrders.map((item) => [item.preguntaId, item.opcionesOrden]));

    return {
      testId: test.id,
      temaId: temaId || null,
      oposicionId: oposicionId || null,
      numeroPreguntas: preguntas.length,
      modo: 'refuerzo',
      dificultad: 'mixto',
      duracionSegundos: null,
      preguntas: preguntas.map((pregunta) => ({
        ...pregunta,
        opciones: orderOptions(pregunta.opciones, orderByQuestion.get(String(pregunta.id))),
      })),
    };
  },
};
