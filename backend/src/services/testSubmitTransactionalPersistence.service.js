import { testRepository } from '../repositories/test.repository.js';
import { albacerProgressRepository } from '../repositories/albacerProgress.repository.js';

export const testSubmitTransactionalPersistenceService = {
  async persistSubmission({
    client,
    userId,
    testId,
    tiempoSegundos,
    aciertos,
    errores,
    blancos,
    nota,
    respuestasEvaluadas,
  }) {
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
    await albacerProgressRepository.refreshMandatoryItemProgress(userId, testId, client);
  },
};
