import { apiRequest } from './api';

export const catalogApi = {
  getOposiciones: () => apiRequest('/oposiciones'),
  getMaterias: (oposicionId) => apiRequest(`/materias?oposicion_id=${oposicionId}`),
  getTemas: (materiaId) => apiRequest(`/temas?materia_id=${materiaId}`),
};