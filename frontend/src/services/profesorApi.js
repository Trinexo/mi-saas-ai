import { apiRequest } from './api';

export const profesorApi = {
  getDashboard: (token) =>
    apiRequest('/profesor/dashboard', { token }),

  getMisOposiciones: (token) =>
    apiRequest('/profesor/mis-oposiciones', { token }),

  getMisPreguntas: (token, query = {}) =>
    apiRequest('/profesor/mis-preguntas', { token, query }),

  // Reutiliza endpoints admin (accesibles para profesor)
  createPregunta: (token, payload) =>
    apiRequest('/admin/preguntas', { method: 'POST', body: payload, token }),
};
