import { apiRequest } from './api';

export const adminApi = {
  listPreguntas: (token, query = '') => apiRequest(`/admin/preguntas${query ? `?${query}` : ''}`, { token }),
  getPregunta: (token, id) => apiRequest(`/admin/preguntas/${id}`, { token }),
  createPregunta: (token, payload) => apiRequest('/admin/preguntas', { method: 'POST', body: payload, token }),
  updatePregunta: (token, id, payload) => apiRequest(`/admin/preguntas/${id}`, { method: 'PUT', body: payload, token }),
  deletePregunta: (token, id) => apiRequest(`/admin/preguntas/${id}`, { method: 'DELETE', token }),
  importPreguntasCsv: (token, payload) => apiRequest('/admin/preguntas/import', { method: 'POST', body: payload, token }),
  listReportes: (token, query = '') => apiRequest(`/admin/reportes${query ? `?${query}` : ''}`, { token }),
  updateReporteEstado: (token, reporteId, estado) =>
    apiRequest(`/admin/reportes/${reporteId}/estado`, { method: 'PATCH', body: { estado }, token }),
};