import { apiRequest } from './api';

export const marcadasApi = {
  getMarcadas: (token, oposicionId = null) => apiRequest('/marcadas', { token, query: oposicionId ? { oposicion_id: oposicionId } : {} }),
  marcar: (token, preguntaId) => apiRequest(`/marcadas/${preguntaId}`, { method: 'POST', token }),
  desmarcar: (token, preguntaId) => apiRequest(`/marcadas/${preguntaId}`, { method: 'DELETE', token }),
};
