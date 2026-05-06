import { apiRequest } from './api';

export const catalogApi = {
  getOposiciones: () => apiRequest('/oposiciones'),
  getTemas: (oposicionId) => apiRequest('/temas', { query: { oposicion_id: oposicionId } }),
  getBloques: (temaId) => apiRequest('/bloques', { query: { tema_id: temaId } }),
};