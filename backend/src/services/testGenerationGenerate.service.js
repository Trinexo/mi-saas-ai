import { ApiError } from '../utils/api-error.js';
import { testRepository } from '../repositories/test.repository.js';

export const testGenerationGenerateService = {
  async generate({ userId, temaId, oposicionId, numeroPreguntas, modo = 'adaptativo', dificultad = 'mixto', duracionSegundos }) {
    const NIVEL_MAP = { facil: 1, media: 2, dificil: 3 };

    const calcCuotas = (n) => {
      const facil = Math.floor(n * 0.3);
      const dificil = Math.floor(n * 0.3);
      return { facil, dificil, media: n - facil - dificil };
    };

    let preguntas;

    if (modo === 'marcadas') {
      preguntas = await testRepository.pickMarcadasQuestions({ userId, numeroPreguntas });
    } else if (modo === 'simulacro') {
      preguntas = await testRepository.pickSimulacroQuestions({ oposicionId, numeroPreguntas });
    } else if (modo === 'repaso') {
      preguntas = await testRepository.pickDueQuestions({ userId, temaId, numeroPreguntas });
    } else if (!temaId && oposicionId) {
      preguntas = await testRepository.pickSimulacroQuestions({ oposicionId, numeroPreguntas });
    } else {
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
        preguntas = [...pMedia, ...pFacil, ...pDificil];
      } else {
        preguntas = await pickPrimary({ userId, temaId, numeroPreguntas, nivelDificultad: NIVEL_MAP[dificultad] });
      }
    }

    // Fallback solo para modos basados en tema concreto
    if (preguntas.length < numeroPreguntas && !['simulacro', 'marcadas'].includes(modo) && temaId) {
      const excludeIds = preguntas.map((p) => p.id);
      const extra = await testRepository.pickAnyQuestions({
        userId,
        temaId,
        numeroPreguntas: numeroPreguntas - preguntas.length,
        excludePreguntaIds: excludeIds,
      });
      preguntas = [...preguntas, ...extra];

      if (preguntas.length < numeroPreguntas) {
        throw new ApiError(400, 'No hay preguntas suficientes para generar el test con el criterio solicitado');
      }
    }

    if (preguntas.length === 0) {
      throw new ApiError(400, 'No hay preguntas disponibles para el test');
    }

    const test = await testRepository.createTest({
      userId,
      temaId: temaId || null,
      oposicionId: oposicionId || null,
      tipoTest: modo,
      numeroPreguntas: preguntas.length,
      duracionSegundos: duracionSegundos || null,
    });
    await testRepository.insertTestPreguntas(test.id, preguntas.map((item) => item.id));

    const { temaNombre, oposicionNombre } = await testRepository.getContextoNombres(temaId || null, oposicionId || null);

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
      preguntas,
    };
  },
};
