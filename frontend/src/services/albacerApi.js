import { apiRequest } from './api';

export const albacerApi = {
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
};
