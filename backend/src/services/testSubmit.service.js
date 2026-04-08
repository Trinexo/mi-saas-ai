import pool from '../config/db.js';
import { testRepository } from '../repositories/test.repository.js';
import { spacedRepetitionRepository } from '../repositories/spacedRepetition.repository.js';
import { testSubmitValidationService } from './testSubmitValidation.service.js';
import { testSubmitScoringService } from './testSubmitScoring.service.js';

export const testSubmitService = {
  async submit({ userId, testId, respuestas = [], tiempoSegundos }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const test = await testRepository.getTestById(client, testId);
      testSubmitValidationService.assertTestExistsAndOwner(test, userId);
      testSubmitValidationService.assertTestNotFinalized(test);

      const mapaRespuestasCorrectas = await testRepository.getCorrectAnswersByTest(client, testId);
      const uniquePreguntaIds = testSubmitValidationService.assertNoDuplicateRespuestas(respuestas);
      testSubmitValidationService.assertPreguntasBelongToTest(uniquePreguntaIds, mapaRespuestasCorrectas);

      const { aciertos, errores, blancos, nota, respuestasEvaluadas } = testSubmitScoringService.evaluateRespuestas({
        respuestas,
        mapaRespuestasCorrectas,
      });

      for (const respuesta of respuestasEvaluadas) {
        await testRepository.insertRespuesta(client, {
          testId,
          preguntaId: respuesta.preguntaId,
          respuestaId: respuesta.respuestaId,
          correcta: respuesta.correcta,
        });
      }

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

      respuestasEvaluadas.forEach((respuesta) => {
        spacedRepetitionRepository
          .upsertRepaso({ userId, preguntaId: respuesta.preguntaId, correcta: respuesta.correcta })
          .catch(() => {});
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
};
