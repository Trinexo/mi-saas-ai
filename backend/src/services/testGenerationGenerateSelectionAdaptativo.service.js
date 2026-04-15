import { testRepository } from '../repositories/test.repository.js';

const NIVEL_MAP = { facil: 1, media: 2, dificil: 3 };

const calcCuotas = (numeroPreguntas) => {
  const facil = Math.floor(numeroPreguntas * 0.3);
  const dificil = Math.floor(numeroPreguntas * 0.3);
  return { facil, dificil, media: numeroPreguntas - facil - dificil };
};

export const testGenerationGenerateSelectionAdaptativoService = {
  async pickAdaptativo({ userId, temaId, numeroPreguntas, modo, dificultad = 'mixto' }) {
    const pickPrimary = (params) =>
      modo === 'adaptativo'
        ? testRepository.pickAdaptiveQuestions({ ...params, excludePreguntaIds: [] })
        : testRepository.pickFreshQuestions(params);

    if (dificultad === 'mixto') {
      const cuotas = calcCuotas(numeroPreguntas);
      const [pMedia, pFacil, pDificil] = await Promise.all([
        pickPrimary({ userId, temaId, numeroPreguntas: cuotas.media, nivelDificultad: NIVEL_MAP.media }),
        pickPrimary({ userId, temaId, numeroPreguntas: cuotas.facil, nivelDificultad: NIVEL_MAP.facil }),
        pickPrimary({ userId, temaId, numeroPreguntas: cuotas.dificil, nivelDificultad: NIVEL_MAP.dificil }),
      ]);
      return [...pMedia, ...pFacil, ...pDificil];
    }

    return pickPrimary({ userId, temaId, numeroPreguntas, nivelDificultad: NIVEL_MAP[dificultad] });
  },
};
