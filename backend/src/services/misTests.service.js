import { misTestsRepository } from '../repositories/misTests.repository.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { testGenerationGeneratePersistenceService } from './testGenerationGeneratePersistence.service.js';
import { ApiError } from '../utils/api-error.js';

export const misTestsService = {
  async getPublicados(userId, plan = 'free', requestedOposicionId = null) {
    const accesos = await accesoOposicionRepository.getAccesosActivos(userId);
    const filteredAccesos = requestedOposicionId
      ? accesos.filter((acceso) => Number(acceso.oposicion_id) === Number(requestedOposicionId))
      : accesos;

    const albacerOposicionIds = filteredAccesos
      .filter((acceso) => acceso.tipo_alumno === 'albacer')
      .map((acceso) => Number(acceso.oposicion_id));

    if (albacerOposicionIds.length > 0) {
      return misTestsRepository.getPublicados(albacerOposicionIds, plan, false);
    }

    const oposicionIds = filteredAccesos.map((acceso) => Number(acceso.oposicion_id));
    return misTestsRepository.getPublicados(oposicionIds, plan, true);
  },

  async iniciar(userId, testId) {
    const data = await misTestsRepository.getTestConPreguntas(testId);
    if (!data) throw new ApiError(404, 'Test no encontrado o no publicado');
    if (!data.preguntas || data.preguntas.length === 0) {
      throw new ApiError(422, 'Este test no tiene preguntas asignadas todavia');
    }

    const accesos = await accesoOposicionRepository.getAccesosActivos(userId);
    const acceso = accesos.find((item) => Number(item.oposicion_id) === Number(data.test.oposicion_id));
    if (!acceso) throw new ApiError(403, 'No tienes acceso a la oposicion de este test');
    if (acceso.tipo_alumno !== 'albacer' && !data.test.es_demo) {
      throw new ApiError(403, 'Este test esta disponible solo para alumnos Albacer');
    }

    const preguntasSinRespuesta = data.preguntas.map(({ id, enunciado, nivel_dificultad, imagen_url, audio_url, opciones }) => ({
      id,
      enunciado,
      nivel_dificultad,
      imagen_url,
      audio_url,
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
