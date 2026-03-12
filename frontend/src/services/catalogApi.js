import { apiRequest } from './api';

export const catalogApi = {
  getOposiciones: () => apiRequest('/oposiciones'),
  getMaterias: (oposicionId) => apiRequest('/materias', { query: { oposicion_id: oposicionId } }),
  getTemas: (materiaId) => apiRequest('/temas', { query: { materia_id: materiaId } }),
};