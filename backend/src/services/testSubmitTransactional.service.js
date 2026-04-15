import pool from '../config/db.js';
import { testSubmitTransactionalPreparationService } from './testSubmitTransactionalPreparation.service.js';
import { testSubmitTransactionalPersistenceService } from './testSubmitTransactionalPersistence.service.js';

export const testSubmitTransactionalService = {
  async submitTransactional({ userId, testId, respuestas = [], tiempoSegundos }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { aciertos, errores, blancos, nota, respuestasEvaluadas } =
        await testSubmitTransactionalPreparationService.prepareSubmission({
          client,
          userId,
          testId,
          respuestas,
        });

      await testSubmitTransactionalPersistenceService.persistSubmission({
        client,
        userId,
        testId,
        tiempoSegundos,
        aciertos,
        errores,
        blancos,
        nota,
        respuestas,
        respuestasEvaluadas,
      });
      await client.query('COMMIT');

      return {
        testId,
        aciertos,
        errores,
        blancos,
        nota,
        tiempoSegundos,
        respuestasEvaluadas,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};