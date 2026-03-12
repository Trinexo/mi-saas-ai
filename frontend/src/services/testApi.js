import { apiRequest } from './api';

export const testApi = {
  generate: (token, payload) => apiRequest('/tests/generate', { method: 'POST', body: payload, token }),
  submit: (token, payload) => apiRequest('/tests/submit', { method: 'POST', body: payload, token }),
  userStats: (token) => apiRequest('/stats/user', { token }),
  temaStats: (token, temaId) => apiRequest(`/stats/tema?tema_id=${temaId}`, { token }),
};