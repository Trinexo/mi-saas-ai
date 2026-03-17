import pool from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { testRepository } from '../repositories/test.repository.js';

const calcNota = ({ aciertos, errores, total }) => {
  const netas = aciertos - errores * 0.33;
  return Number(Math.max(0, (netas / total) * 10).toFixed(2));
};

export const testService = {
  async generate({ userId, temaId, numeroPreguntas, modo = 'adaptativo' }) {
    let preguntas;

    if (modo === 'adaptativo') {
      preguntas = await testRepository.pickAdaptiveQuestions({ userId, temaId, numeroPreguntas, excludePreguntaIds: [] });
    } else {
      preguntas = await testRepository.pickFreshQuestions({ userId, temaId, numeroPreguntas });
    }

    if (preguntas.length < numeroPreguntas) {
      const excludeIds = preguntas.map((p) => p.id);
      const extra = await testRepository.pickAnyQuestions({
        userId,
        temaId,
        numeroPreguntas: numeroPreguntas - preguntas.length,
        excludePreguntaIds: excludeIds,
      });
      preguntas = [...preguntas, ...extra];
    }

    if (preguntas.length < numeroPreguntas) {
      throw new ApiError(400, 'No hay preguntas suficientes para generar el test con el criterio solicitado');
    }

    const test = await testRepository.createTest({ userId, temaId, numeroPreguntas: preguntas.length });
    await testRepository.insertTestPreguntas(test.id, preguntas.map((item) => item.id));

    return {
      testId: test.id,
      temaId,
      numeroPreguntas: preguntas.length,
      modo,
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
};