import { testRepository } from '../repositories/test.repository.js';

const calcCuotas = (numeroPreguntas) => {
  const tercio = Math.floor(numeroPreguntas / 3);
  return { facil: tercio, media: numeroPreguntas - 2 * tercio, dificil: tercio };
};

export const testGenerationGenerateSelectionAdaptativoService = {
  async pickAdaptativo({ userId, temaId, numeroPreguntas, modo, dificultad = 'mixto' }) {
    const pickPrimary = (params) =>
      modo === 'adaptativo'
        ? testRepository.pickAdaptiveQuestions({ ...params, excludePreguntaIds: [] })
        : testRepository.pickFreshQuestions(params);

    if (dificultad === 'mixto') {
      const cuotas = calcCuotas(numeroPreguntas);
      const [pFacil, pMedia, pDificil] = await Promise.all([
        pickPrimary({ userId, temaId, numeroPreguntas: cuotas.facil,   nivelDificultad: 'facil' }),
        pickPrimary({ userId, temaId, numeroPreguntas: cuotas.media,   nivelDificultad: 'media' }),
        pickPrimary({ userId, temaId, numeroPreguntas: cuotas.dificil, nivelDificultad: 'dificil' }),
      ]);
      return [...pFacil, ...pMedia, ...pDificil];
    }

    return pickPrimary({ userId, temaId, numeroPreguntas, nivelDificultad: dificultad });
  },
};
