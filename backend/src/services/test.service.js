import pool from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { testRepository } from '../repositories/test.repository.js';
import { spacedRepetitionRepository } from '../repositories/spacedRepetition.repository.js';

const calcNota = ({ aciertos, errores, total }) => {
  const netas = aciertos - errores * 0.33;
  return Number(Math.max(0, (netas / total) * 10).toFixed(2));
};

export const testService = {
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

    // Fallback solo para modos basados en tema
    if (preguntas.length < numeroPreguntas && !['simulacro', 'marcadas'].includes(modo)) {
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

    return {
      testId: test.id,
      temaId: temaId || null,
      oposicionId: oposicionId || null,
      numeroPreguntas: preguntas.length,
      modo,
      dificultad,
      duracionSegundos: duracionSegundos || null,
      preguntas,
    };
  },

  async generateRefuerzo({ userId, temaId, numeroPreguntas = 10 }) {
    let preguntas = await testRepository.pickRefuerzoQuestions({ userId, numeroPreguntas, temaId: temaId || null });

    // Completar con preguntas adaptativas si no hay suficientes falladas
    if (preguntas.length < numeroPreguntas && temaId) {
      const excludeIds = preguntas.map((p) => p.id);
      const extra = await testRepository.pickAdaptiveQuestions({
        userId,
        temaId,
        numeroPreguntas: numeroPreguntas - preguntas.length,
        excludePreguntaIds: excludeIds,
      });
      preguntas = [...preguntas, ...extra];
    }

    if (preguntas.length === 0) {
      throw new ApiError(400, 'No hay preguntas disponibles para el refuerzo');
    }

    const test = await testRepository.createTest({
      userId,
      temaId: temaId || null,
      oposicionId: null,
      tipoTest: 'refuerzo',
      numeroPreguntas: preguntas.length,
      duracionSegundos: null,
    });
    await testRepository.insertTestPreguntas(test.id, preguntas.map((item) => item.id));

    return {
      testId: test.id,
      temaId: temaId || null,
      numeroPreguntas: preguntas.length,
      modo: 'refuerzo',
      dificultad: 'mixto',
      duracionSegundos: null,
      preguntas,
    };
  },

  async submit({ userId, testId, respuestas = [], tiempoSegundos }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const test = await testRepository.getTestById(client, testId);
      if (!test || test.usuario_id !== userId) {
        throw new ApiError(404, 'Test no encontrado');
      }

      if (test.estado === 'finalizado') {
        throw new ApiError(409, 'El test ya fue enviado');
      }

      const mapaRespuestasCorrectas = await testRepository.getCorrectAnswersByTest(client, testId);
      const preguntaIds = respuestas.map((item) => item.preguntaId);
      const uniquePreguntaIds = new Set(preguntaIds);

      if (uniquePreguntaIds.size !== preguntaIds.length) {
        throw new ApiError(400, 'Respuestas duplicadas para la misma pregunta');
      }

      for (const preguntaId of uniquePreguntaIds) {
        if (!mapaRespuestasCorrectas.has(preguntaId)) {
          throw new ApiError(400, 'Hay preguntas que no pertenecen al test');
        }
      }

      let aciertos = 0;
      let errores = 0;
      let blancos = 0;

      for (const respuesta of respuestas) {
        const correcta = mapaRespuestasCorrectas.get(respuesta.preguntaId);
        let isCorrect = false;

        if (!respuesta.respuestaId) {
          blancos += 1;
        } else if (correcta === respuesta.respuestaId) {
          aciertos += 1;
          isCorrect = true;
        } else {
          errores += 1;
        }

        await testRepository.insertRespuesta(client, {
          testId,
          preguntaId: respuesta.preguntaId,
          respuestaId: respuesta.respuestaId,
          correcta: isCorrect,
        });
      }

      const total = mapaRespuestasCorrectas.size;
      blancos = Math.max(blancos, total - (aciertos + errores));
      const nota = calcNota({ aciertos, errores, total });

      await testRepository.insertResultado(client, {
        testId,
        aciertos,
        errores,
        blancos,
        nota,
        tiempoSegundos,
      });

      await testRepository.markTestAsDone(client, testId);
      await testRepository.updateProgress(client, { userId, testId });

      await client.query('COMMIT');

      // fire-and-forget: actualizar repetición espaciada (no bloquea la respuesta)
      respuestas.forEach((r) => {
        const correcta = r.respuestaId != null && mapaRespuestasCorrectas.get(r.preguntaId) === r.respuestaId;
        spacedRepetitionRepository.upsertRepaso({ userId, preguntaId: r.preguntaId, correcta }).catch(() => {});
      });

      return {
        testId,
        aciertos,
        errores,
        blancos,
        nota,
        tiempoSegundos,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getHistory({ userId, limit = 20, page = 1, oposicionId, desde, hasta }) {
    return testRepository.getUserHistory({ userId, limit, page, oposicionId, desde, hasta });
  },

  async getReview({ userId, testId }) {
    const data = await testRepository.getTestReview(userId, testId);
    if (!data) throw new ApiError(404, 'Test no encontrado');
    return data;
  },

  async getConfig({ userId, testId }) {
    const data = await testRepository.getTestConfig(userId, testId);
    if (!data) throw new ApiError(404, 'Test no encontrado');
    return data;
  },
};