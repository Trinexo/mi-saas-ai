import { apiRequest } from './api';

export const notificacionesApi = {
  list: (token, query = {}) =>
    apiRequest('/notificaciones', { token, query }),

  countSinLeer: (token) =>
    apiRequest('/notificaciones/sin-leer', { token }),

  marcarLeida: (token, id) =>
    apiRequest(`/notificaciones/${id}/leer`, { method: 'PATCH', token }),

  marcarTodasLeidas: (token) =>
    apiRequest('/notificaciones/leer-todas', { method: 'PATCH', token }),
};
