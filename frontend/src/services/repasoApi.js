import { apiRequest } from './api';

export const repasoApi = {
  /**
   * Devuelve preguntas pendientes de repaso para el usuario.
   * Requiere plan pro o elite.
   */
  getPendientes: (token, limit = 20) =>
    apiRequest('/repaso/pendientes', { token, query: { limit } }),

  /**
   * Actualiza SM-2 para un batch de respuestas (disponible para todos).
   * respuestas: Array<{ preguntaId: number, acertada: boolean }>
   */
  actualizarBatch: (token, respuestas) =>
    apiRequest('/repaso/actualizar', { method: 'POST', body: { respuestas }, token }),
};
