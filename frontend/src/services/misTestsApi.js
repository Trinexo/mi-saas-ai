import { apiRequest } from './api';

export const misTestsApi = {
  /** Tests publicados del profesor accesibles al alumno */
  getPublicados: (token) => apiRequest('/mis-tests', { token }),

  /** Inicia un test publicado y devuelve la sesión de test */
  iniciar: (token, testId) =>
    apiRequest(`/mis-tests/${testId}/iniciar`, { method: 'POST', token }),
};
