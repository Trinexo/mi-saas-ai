import { apiRequest } from './api';

export const marcadasApi = {
  getMarcadas: (token) => apiRequest('/marcadas', { token }),
  marcar: (token, preguntaId) => apiRequest(`/marcadas/${preguntaId}`, { method: 'POST', token }),
  desmarcar: (token, preguntaId) => apiRequest(`/marcadas/${preguntaId}`, { method: 'DELETE', token }),
};
