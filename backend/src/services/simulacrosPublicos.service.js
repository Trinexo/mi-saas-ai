import { simulacrosPublicosRepository } from '../repositories/simulacrosPublicos.repository.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { testGenerationGeneratePersistenceService } from './testGenerationGeneratePersistence.service.js';
import { ApiError } from '../utils/api-error.js';

export const simulacrosPublicosService = {
  /**
   * Devuelve los simulacros publicados para las oposiciones a las que el usuario tiene acceso.
   */
  async getPublicados(userId) {
    const accesos = await accesoOposicionRepository.getAccesosActivos(userId);
    const oposicionIds = accesos.map((a) => a.oposicion_id);
    return simulacrosPublicosRepository.getPublicados(oposicionIds);
  },

  /**
   * Genera una sesión de test a partir de un simulacro publicado.
   * Carga sus preguntas fijas y persiste la sesión igual que un test normal.
   */
  async iniciarSimulacroPublicado(userId, simulacroId) {
    const data = await simulacrosPublicosRepository.getPreguntasSimulacro(simulacroId);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado o no publicado');
    if (!data.preguntas || data.preguntas.length === 0) {
      throw new ApiError(422, 'Este simulacro no tiene preguntas asignadas todavía');
    }

    // Verificar que el usuario tiene acceso a la oposición del simulacro
    const tieneAcceso = await accesoOposicionRepository.tieneAcceso(userId, data.simulacro.oposicion_id);
    if (!tieneAcceso) {
      throw new ApiError(403, 'No tienes acceso a la oposición de este simulacro');
    }

    const { simulacro, preguntas } = data;

    // Quitar la opción correcta del payload (el motor de persistencia la admite opcionalmente)
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
