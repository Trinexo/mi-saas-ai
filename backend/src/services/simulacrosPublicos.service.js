import { simulacrosPublicosRepository } from '../repositories/simulacrosPublicos.repository.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { testGenerationGeneratePersistenceService } from './testGenerationGeneratePersistence.service.js';
import { ApiError } from '../utils/api-error.js';

export const simulacrosPublicosService = {
  async getPublicados(userId, requestedOposicionId = null) {
    const accesos = await accesoOposicionRepository.getAccesosActivos(userId);
    const activeIds = accesos
      .filter((acceso) => acceso.tipo_alumno === 'albacer')
      .map((acceso) => Number(acceso.oposicion_id));
    const oposicionIds = requestedOposicionId
      ? activeIds.filter((id) => id === Number(requestedOposicionId))
      : activeIds;
    return simulacrosPublicosRepository.getPublicados(oposicionIds);
  },

  async iniciarSimulacroPublicado(userId, simulacroId) {
    const data = await simulacrosPublicosRepository.getPreguntasSimulacro(simulacroId);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado o no publicado');
    if (!data.preguntas || data.preguntas.length === 0) {
      throw new ApiError(422, 'Este simulacro no tiene preguntas asignadas todavia');
    }

    const accesos = await accesoOposicionRepository.getAccesosActivos(userId);
    const acceso = accesos.find((item) => Number(item.oposicion_id) === Number(data.simulacro.oposicion_id));
    if (!acceso) throw new ApiError(403, 'No tienes acceso a la oposicion de este simulacro');
    if (acceso.tipo_alumno !== 'albacer') {
      throw new ApiError(403, 'Este simulacro esta disponible solo para alumnos Albacer');
    }

    const { simulacro, preguntas } = data;
    const preguntasSinRespuesta = preguntas.map(({ id, enunciado, nivel_dificultad, imagen_url, audio_url, opciones }) => ({
      id,
      enunciado,
      nivel_dificultad,
      imagen_url,
      audio_url,
      opciones: opciones.map(({ id: opId, texto }) => ({ id: opId, texto })),
    }));

    return testGenerationGeneratePersistenceService.persistAndBuildResponse({
      userId,
      oposicionId: simulacro.oposicion_id,
      modo: 'simulacro',
      dificultad: 'mixto',
      duracionSegundos: simulacro.tiempo_limite_segundos || null,
      feedbackInmediato: false,
      preguntas: preguntasSinRespuesta,
    });
  },
};
