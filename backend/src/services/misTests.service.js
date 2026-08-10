import { misTestsRepository } from '../repositories/misTests.repository.js';
import { testGenerationGeneratePersistenceService } from './testGenerationGeneratePersistence.service.js';
import { accessContextService, normalizarIdentificador } from './accessContext.service.js';
import { ApiError } from '../utils/api-error.js';

export const misTestsService = {
  async getPublicados(userId, plan = 'free', requestedOposicionId = null) {
    const accesos = await accessContextService.obtenerContextosUsuario({ usuarioId: userId });
    const utilizables = accesos.filter((contexto) => contexto.permisos.puede_acceder_contenido);
    const requestedId = requestedOposicionId == null
      ? null
      : normalizarIdentificador(requestedOposicionId, 'oposicionId');
    const filteredAccesos = requestedId == null
      ? utilizables
      : utilizables.filter((acceso) => BigInt(acceso.oposicion_id) === BigInt(requestedId));

    const albacerOposicionIds = filteredAccesos
      .filter((acceso) => acceso.modo_activo === 'guiado')
      .map((acceso) => acceso.oposicion_id);

    if (albacerOposicionIds.length > 0) {
      return misTestsRepository.getPublicados(albacerOposicionIds, plan, false);
    }

    const oposicionIds = filteredAccesos.map((acceso) => acceso.oposicion_id);
    return misTestsRepository.getPublicados(oposicionIds, plan, true);
  },

  async iniciar(userId, testId) {
    const data = await misTestsRepository.getTestConPreguntas(testId);
    if (!data) throw new ApiError(404, 'Test no encontrado o no publicado');
    if (!data.preguntas || data.preguntas.length === 0) {
      throw new ApiError(422, 'Este test no tiene preguntas asignadas todavia');
    }

    const contexto = await accessContextService.obtenerContextoUsuario({
      usuarioId: userId,
      oposicionId: data.test.oposicion_id,
      principal: { tipo: 'alumno', usuarioId: userId },
    });
    if (!contexto.permisos.puede_acceder_contenido) {
      throw new ApiError(403, 'No tienes acceso a la oposicion de este test');
    }
    if (contexto.modo_activo !== 'guiado' && !data.test.es_demo) {
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
