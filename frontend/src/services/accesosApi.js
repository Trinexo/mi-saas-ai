import { apiRequest } from './api';

export const accesosApi = {
  getMisOposiciones: (token) => apiRequest('/accesos/mis-oposiciones', { token }),
  checkAcceso: (token, oposicionId) => apiRequest(`/accesos/check/${oposicionId}`, { token }),
  // Admin
  listAccesos: (token, query = {}) => apiRequest('/accesos', { token, query }),
  getStats: (token) => apiRequest('/accesos/stats', { token }),
  asignarAcceso: (token, payload) =>
    apiRequest('/accesos/asignar', { method: 'POST', body: payload, token }),
  cancelarAcceso: (token, userId, oposicionId) =>
    apiRequest(`/accesos/users/${userId}/${oposicionId}`, { method: 'DELETE', token }),
  updateAcceso: (token, userId, oposicionId, payload) =>
    apiRequest(`/accesos/users/${userId}/${oposicionId}`, { method: 'PATCH', body: payload, token }),
};
