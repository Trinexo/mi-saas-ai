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

  // Tests propios (B7)
  getMisTests: (token, query = {}) =>
    apiRequest('/profesor/mis-tests', { token, query }),

  // Simulacros propios (B8)
  getMisSimulacros: (token, query = {}) =>
    apiRequest('/profesor/mis-simulacros', { token, query }),
  getMiSimulacro: (token, id) =>
    apiRequest(`/profesor/mis-simulacros/${id}`, { token }),
  createMiSimulacro: (token, payload) =>
    apiRequest('/profesor/mis-simulacros', { method: 'POST', body: payload, token }),
  updateMiSimulacro: (token, id, payload) =>
    apiRequest(`/profesor/mis-simulacros/${id}`, { method: 'PUT', body: payload, token }),
  deleteMiSimulacro: (token, id) =>
    apiRequest(`/profesor/mis-simulacros/${id}`, { method: 'DELETE', token }),
};
