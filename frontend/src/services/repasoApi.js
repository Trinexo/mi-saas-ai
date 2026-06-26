import { apiRequest } from './api';

export const repasoApi = {
  /**
   * Devuelve preguntas pendientes de repaso para el usuario.
   * Requiere plan pro o elite.
   */
  getPendientes: (token, limit = 20, oposicionId = null) =>
    apiRequest('/repaso/pendientes', {
      token,
      query: { limit, ...(oposicionId ? { oposicion_id: oposicionId } : {}) },
    }),

  /**
   * Actualiza SM-2 para un batch de respuestas (disponible para todos).
   * respuestas: Array<{ preguntaId: number, acertada: boolean }>
   */
  actualizarBatch: (token, respuestas) =>
    apiRequest('/repaso/actualizar', { method: 'POST', body: { respuestas }, token }),
};
