import { apiRequest } from './api';

export const albacerApi = {
  getAlumnoEstado: (token, query = {}) =>
    apiRequest('/albacer/estado', { token, query }),
  listAlumnoModulos: (token, query = {}) =>
    apiRequest('/albacer/modulos', { token, query }),
  empezarAlumnoItem: (token, itemId) =>
    apiRequest(`/albacer/items/${itemId}/empezar`, { method: 'POST', token }),
  empezarAlumnoSimulacroFinal: (token, moduloId) =>
    apiRequest(`/albacer/modulos/${moduloId}/simulacro-final/empezar`, { method: 'POST', token }),

  listAdminModulos: (token, query = {}) =>
    apiRequest('/admin/albacer/modulos', { token, query }),
  getAdminModulo: (token, id) =>
    apiRequest(`/admin/albacer/modulos/${id}`, { token }),
  createAdminModulo: (token, payload) =>
    apiRequest('/admin/albacer/modulos', { method: 'POST', token, body: payload }),
  updateAdminModulo: (token, id, payload) =>
    apiRequest(`/admin/albacer/modulos/${id}`, { method: 'PUT', token, body: payload }),
  deleteAdminModulo: (token, id) =>
    apiRequest(`/admin/albacer/modulos/${id}`, { method: 'DELETE', token }),
  listAdminModuloItems: (token, moduloId) =>
    apiRequest(`/admin/albacer/modulos/${moduloId}/items`, { token }),
  createAdminModuloItem: (token, moduloId, payload) =>
    apiRequest(`/admin/albacer/modulos/${moduloId}/items`, { method: 'POST', token, body: payload }),
  updateAdminModuloItem: (token, moduloId, itemId, payload) =>
    apiRequest(`/admin/albacer/modulos/${moduloId}/items/${itemId}`, { method: 'PUT', token, body: payload }),
  deleteAdminModuloItem: (token, moduloId, itemId) =>
    apiRequest(`/admin/albacer/modulos/${moduloId}/items/${itemId}`, { method: 'DELETE', token }),
  createAdminModuloTest: (token, moduloId, payload = {}) =>
    apiRequest(`/admin/albacer/modulos/${moduloId}/tests`, { method: 'POST', token, body: payload }),
  generateAdminModuloAuto: (token, moduloId, payload = {}) =>
    apiRequest(`/admin/albacer/modulos/${moduloId}/generar-auto`, { method: 'POST', token, body: payload }),
  getAdminModuloUsedQuestions: (token, moduloId, query = {}) =>
    apiRequest(`/admin/albacer/modulos/${moduloId}/preguntas-usadas`, { token, query }),

  listProfesorModulos: (token, query = {}) =>
    apiRequest('/profesor/albacer/modulos', { token, query }),
  getProfesorModulo: (token, id) =>
    apiRequest(`/profesor/albacer/modulos/${id}`, { token }),
  createProfesorModulo: (token, payload) =>
    apiRequest('/profesor/albacer/modulos', { method: 'POST', token, body: payload }),
  updateProfesorModulo: (token, id, payload) =>
    apiRequest(`/profesor/albacer/modulos/${id}`, { method: 'PUT', token, body: payload }),
  deleteProfesorModulo: (token, id) =>
    apiRequest(`/profesor/albacer/modulos/${id}`, { method: 'DELETE', token }),
  listProfesorModuloItems: (token, moduloId) =>
    apiRequest(`/profesor/albacer/modulos/${moduloId}/items`, { token }),
  createProfesorModuloItem: (token, moduloId, payload) =>
    apiRequest(`/profesor/albacer/modulos/${moduloId}/items`, { method: 'POST', token, body: payload }),
  updateProfesorModuloItem: (token, moduloId, itemId, payload) =>
    apiRequest(`/profesor/albacer/modulos/${moduloId}/items/${itemId}`, { method: 'PUT', token, body: payload }),
  deleteProfesorModuloItem: (token, moduloId, itemId) =>
    apiRequest(`/profesor/albacer/modulos/${moduloId}/items/${itemId}`, { method: 'DELETE', token }),
  createProfesorModuloTest: (token, moduloId, payload = {}) =>
    apiRequest(`/profesor/albacer/modulos/${moduloId}/tests`, { method: 'POST', token, body: payload }),
  generateProfesorModuloAuto: (token, moduloId, payload = {}) =>
    apiRequest(`/profesor/albacer/modulos/${moduloId}/generar-auto`, { method: 'POST', token, body: payload }),
  getProfesorModuloUsedQuestions: (token, moduloId, query = {}) =>
    apiRequest(`/profesor/albacer/modulos/${moduloId}/preguntas-usadas`, { token, query }),
};
