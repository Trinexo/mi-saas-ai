import { apiRequest } from './api';

export const planEstudioApi = {
  list: (token, oposicionId) =>
    apiRequest('/plan-estudio', { token, query: { oposicion_id: oposicionId } }),
  empezar: (token, id) =>
    apiRequest(`/plan-estudio/${id}/empezar`, { method: 'POST', token }),
};
