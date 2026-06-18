import { apiRequest } from './api';

export const simulacrosApi = {
  /** Simulacros publicados por el profesor accesibles al alumno */
  getPublicados: (token, oposicionId) => apiRequest('/simulacros', { token, query: oposicionId ? { oposicion_id: oposicionId } : {} }),

  /** Inicia un simulacro publicado y devuelve la sesión de test */
  iniciar: (token, simulacroId) =>
    apiRequest(`/simulacros/${simulacroId}/iniciar`, { method: 'POST', token }),
};
