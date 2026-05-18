import { apiRequest } from './api';

export const simulacrosApi = {
  /** Simulacros publicados por el profesor accesibles al alumno */
  getPublicados: (token) => apiRequest('/simulacros', { token }),

  /** Inicia un simulacro publicado y devuelve la sesión de test */
  iniciar: (token, simulacroId) =>
    apiRequest(`/simulacros/${simulacroId}/iniciar`, { method: 'POST', token }),
};
