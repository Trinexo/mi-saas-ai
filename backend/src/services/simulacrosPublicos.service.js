import { simulacrosPublicosRepository } from '../repositories/simulacrosPublicos.repository.js';
import { accessContextService, normalizarIdentificador } from './accessContext.service.js';
import { testGenerationGeneratePersistenceService } from './testGenerationGeneratePersistence.service.js';
import { ApiError } from '../utils/api-error.js';

export const simulacrosPublicosService = {
  async getPublicados(userId, requestedOposicionId = null) {
    const accesos = await accessContextService.obtenerContextosUsuario({ usuarioId: userId });
    const activeIds = accesos
      .filter((acceso) => acceso.permisos.puede_acceder_contenido && acceso.modo_activo === 'guiado')
      .map((acceso) => acceso.oposicion_id);
    const requestedId = requestedOposicionId == null
      ? null
      : normalizarIdentificador(requestedOposicionId, 'oposicionId');
    const oposicionIds = requestedId == null
      ? activeIds
      : activeIds.filter((id) => BigInt(id) === BigInt(requestedId));
    return simulacrosPublicosRepository.getPublicados(oposicionIds);
  },

  async iniciarSimulacroPublicado(userId, simulacroId) {
    const data = await simulacrosPublicosRepository.getPreguntasSimulacro(simulacroId);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado o no publicado');
    if (!data.preguntas || data.preguntas.length === 0) {
      throw new ApiError(422, 'Este simulacro no tiene preguntas asignadas todavia');
    }

    const contexto = await accessContextService.obtenerContextoUsuario({
      usuarioId: userId,
      oposicionId: data.simulacro.oposicion_id,
      principal: { tipo: 'alumno', usuarioId: userId },
    });
    if (!contexto.permisos.puede_acceder_contenido || contexto.modo_activo !== 'guiado') {
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
