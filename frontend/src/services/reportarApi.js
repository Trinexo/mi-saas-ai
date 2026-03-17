import { apiRequest } from './api';

export const reportarApi = {
  reportar: (token, preguntaId, motivo) =>
    apiRequest(`/preguntas/${preguntaId}/reportar`, { method: 'POST', token, body: { motivo } }),
};
