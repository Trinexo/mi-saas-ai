import { misTestsRepository } from '../repositories/misTests.repository.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { testGenerationGeneratePersistenceService } from './testGenerationGeneratePersistence.service.js';
import { ApiError } from '../utils/api-error.js';

export const misTestsService = {
  async getPublicados(userId, plan = 'free') {
    const accesos = await accesoOposicionRepository.getAccesosActivos(userId);
    const oposicionIds = accesos.map((a) => a.oposicion_id);
    return misTestsRepository.getPublicados(oposicionIds, plan);
  },

  async iniciar(userId, testId) {
    const data = await misTestsRepository.getTestConPreguntas(testId);
    if (!data) throw new ApiError(404, 'Test no encontrado o no publicado');
    if (!data.preguntas || data.preguntas.length === 0) {
      throw new ApiError(422, 'Este test no tiene preguntas asignadas todavía');
    }

    const tieneAcceso = await accesoOposicionRepository.tieneAcceso(userId, data.test.oposicion_id);
    if (!tieneAcceso) throw new ApiError(403, 'No tienes acceso a la oposición de este test');

    const preguntasSinRespuesta = data.preguntas.map(({ id, enunciado, nivel_dificultad, imagen_url, audio_url, opciones }) => ({
      id, enunciado, nivel_dificultad, imagen_url, audio_url,
      opciones: opciones.map(({ id: opId, texto }) => ({ id: opId, texto })),
    }));

    return testGenerationGeneratePersistenceService.persistAndBuildResponse({
      userId,
      oposicionId: data.test.oposicion_id,
      modo: 'normal',
      dificultad: data.test.nivel_dificultad || 'mixto',
      duracionSegundos: data.test.duracion_minutos ? data.test.duracion_minutos * 60 : null,
      feedbackInmediato: true,
      preguntas: preguntasSinRespuesta,
    });
  },
};
