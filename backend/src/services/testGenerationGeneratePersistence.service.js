import { testRepository } from '../repositories/test.repository.js';
import { orderOptions } from '../utils/test-option-order.js';

export const testGenerationGeneratePersistenceService = {
  async persistAndBuildResponse({ userId, temaId, oposicionId, modo, dificultad, duracionSegundos, preguntas, feedbackInmediato = false }) {
    const test = await testRepository.createTest({
      userId,
      temaId: temaId || null,
      oposicionId: oposicionId || null,
      tipoTest: modo,
      numeroPreguntas: preguntas.length,
      duracionSegundos: duracionSegundos || null,
    });
    const optionOrders = (await testRepository.insertTestPreguntas(test.id, preguntas.map((item) => item.id))) ?? [];

    const { temaNombre, oposicionNombre } = await testRepository.getContextoNombres(temaId || null, oposicionId || null);

    const orderByQuestion = new Map(optionOrders.map((item) => [item.preguntaId, item.opcionesOrden]));
    let preguntasResponse = preguntas.map((pregunta) => ({
      ...pregunta,
      opciones: orderOptions(pregunta.opciones, orderByQuestion.get(String(pregunta.id))),
    }));
    if (feedbackInmediato) {
      const correctasMap = await testRepository.getOpcionesCorrectasByPreguntaIds(preguntas.map((p) => p.id));
      preguntasResponse = preguntasResponse.map((p) => ({ ...p, opcionCorrectaId: correctasMap[p.id] ?? null }));
    }

    return {
      testId: test.id,
      temaId: temaId || null,
      oposicionId: oposicionId || null,
      temaNombre,
      oposicionNombre,
      numeroPreguntas: preguntas.length,
      modo,
      dificultad,
      duracionSegundos: duracionSegundos || null,
      feedbackInmediato,
      preguntas: preguntasResponse,
    };
  },
};
