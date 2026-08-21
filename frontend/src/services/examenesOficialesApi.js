import { apiRequest } from './api';

export const examenesOficialesApi = {
  getAnios: (token, oposicionId) => apiRequest(`/examenes-oficiales/oposiciones/${oposicionId}/anios`, { token }),
  createAnio: (token, oposicionId, anio) => apiRequest(`/examenes-oficiales/oposiciones/${oposicionId}/anios`, { method: 'POST', body: { anio }, token }),
  list: (token, query = {}) => apiRequest('/examenes-oficiales', { token, query }),
  listForOposicion: (token, oposicionId, query = {}) => apiRequest(`/examenes-oficiales/oposiciones/${oposicionId}/examenes`, { token, query: { ...query, oposicionId } }),
  create: (token, payload) => apiRequest('/examenes-oficiales', { method: 'POST', body: payload, token }),
  getPreguntaAnios: (token, preguntaId) => apiRequest(`/examenes-oficiales/preguntas/${preguntaId}/anios`, { token }),
  setPreguntaAnios: (token, preguntaId, anioIds) => apiRequest(`/examenes-oficiales/preguntas/${preguntaId}/anios`, { method: 'PUT', body: { anioIds }, token }),
  getPreguntaExamenes: (token, preguntaId) => apiRequest(`/examenes-oficiales/preguntas/${preguntaId}/examenes`, { token }),
  setPreguntaExamenes: (token, preguntaId, examenIds) => apiRequest(`/examenes-oficiales/preguntas/${preguntaId}/examenes`, { method: 'PUT', body: { examenIds }, token }),
};
