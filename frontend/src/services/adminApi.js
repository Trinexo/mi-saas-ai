import { apiRequest } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const adminApi = {
  listPreguntas: (token, query = {}) => apiRequest('/admin/preguntas', { token, query }),
  getPregunta: (token, id) => apiRequest(`/admin/preguntas/${id}`, { token }),
  createPregunta: (token, payload) => apiRequest('/admin/preguntas', { method: 'POST', body: payload, token }),
  updatePregunta: (token, id, payload) => apiRequest(`/admin/preguntas/${id}`, { method: 'PUT', body: payload, token }),
  deletePregunta: (token, id) => apiRequest(`/admin/preguntas/${id}`, { method: 'DELETE', token }),
  importPreguntasCsv: (token, payload) => apiRequest('/admin/preguntas/import', { method: 'POST', body: payload, token }),
  listReportes: (token, query = {}) => apiRequest('/admin/reportes', { token, query }),
  updateReporteEstado: (token, reporteId, estado, mensajeAdmin) =>
    apiRequest(`/admin/reportes/${reporteId}/estado`, { method: 'PATCH', body: { estado, ...(mensajeAdmin ? { mensajeAdmin } : {}) }, token }),
  listAuditoria: (token, query = {}) => apiRequest('/admin/auditoria', { token, query }),

  // Catálogo: oposiciones
  createOposicion: (token, payload) => apiRequest('/admin/catalogo/oposiciones', { method: 'POST', body: payload, token }),
  updateOposicion: (token, id, payload) => apiRequest(`/admin/catalogo/oposiciones/${id}`, { method: 'PUT', body: payload, token }),
  deleteOposicion: (token, id) => apiRequest(`/admin/catalogo/oposiciones/${id}`, { method: 'DELETE', token }),

  // Catálogo: temas (primer nivel bajo oposición)
  createTema: (token, payload) => apiRequest('/admin/catalogo/temas', { method: 'POST', body: payload, token }),
  updateTema: (token, id, payload) => apiRequest(`/admin/catalogo/temas/${id}`, { method: 'PUT', body: payload, token }),
  deleteTema: (token, id) => apiRequest(`/admin/catalogo/temas/${id}`, { method: 'DELETE', token }),

  // Catálogo: bloques (segundo nivel bajo tema)
  createBloque: (token, payload) => apiRequest('/admin/catalogo/bloques', { method: 'POST', body: payload, token }),
  updateBloque: (token, id, payload) => apiRequest(`/admin/catalogo/bloques/${id}`, { method: 'PUT', body: payload, token }),
  deleteBloque: (token, id) => apiRequest(`/admin/catalogo/bloques/${id}`, { method: 'DELETE', token }),

  // Stats globales
  getAdminStats: (token) => apiRequest('/admin/stats', { token }),
  getBloquesConMasErrores: (token, limit = 10) =>
    apiRequest('/admin/stats/bloques-errores', { token, query: { limit } }),

  // Usuarios
  listUsers: (token, query = {}) => apiRequest('/admin/users', { token, query }),
  updateUserRole: (token, userId, role) =>
    apiRequest(`/admin/users/${userId}/role`, { method: 'PATCH', body: { role }, token }),
  deleteUser: (token, userId) =>
    apiRequest(`/admin/users/${userId}`, { method: 'DELETE', token }),
  bulkUsers: (token, payload) =>
    apiRequest('/admin/users/bulk', { method: 'POST', body: payload, token }),

  getPregunta: (token, id) =>
    apiRequest(`/admin/preguntas/${id}`, { token }),

  // Billing: precio de oposiciones
  setPrecioOposicion: (token, oposicionId, precioEuros) =>
    apiRequest(`/billing/oposiciones/${oposicionId}/precio`, {
      method: 'PATCH',
      body: { precioEuros },
      token,
    }),

  // Asignaciones profesor-oposición
  listProfesorAsignaciones: (token, email) =>
    apiRequest('/admin/profesores/asignaciones', { token, query: { email } }),
  assignProfesorOposicion: (token, payload) =>
    apiRequest('/admin/profesores/asignaciones', { method: 'POST', body: payload, token }),
  removeProfesorOposicion: (token, payload) =>
    apiRequest('/admin/profesores/asignaciones', { method: 'DELETE', body: payload, token }),

  // Profesores: CRUD
  listProfesores: (token, query = {}) =>
    apiRequest('/admin/profesores', { token, query }),
  createProfesor: (token, payload) =>
    apiRequest('/admin/profesores', { method: 'POST', body: payload, token }),
  updateProfesor: (token, id, payload) =>
    apiRequest(`/admin/profesores/${id}`, { method: 'PATCH', body: payload, token }),
  deleteProfesor: (token, id) =>
    apiRequest(`/admin/profesores/${id}`, { method: 'DELETE', token }),

  // Catálogo: oposiciones con stats
  listOposicionesConStats: (token, query = {}) =>
    apiRequest('/admin/catalogo/oposiciones', { token, query }),
  listTemas: (token, oposicionId) =>
    apiRequest('/temas', { token, query: { oposicion_id: oposicionId } }),

  // Simulacros
  listSimulacros: (token, query = {}) =>
    apiRequest('/admin/simulacros', { token, query }),
  getSimulacro: (token, id) =>
    apiRequest(`/admin/simulacros/${id}`, { token }),
  createSimulacro: (token, payload) =>
    apiRequest('/admin/simulacros', { method: 'POST', body: payload, token }),
  updateSimulacro: (token, id, payload) =>
    apiRequest(`/admin/simulacros/${id}`, { method: 'PUT', body: payload, token }),
  deleteSimulacro: (token, id) =>
    apiRequest(`/admin/simulacros/${id}`, { method: 'DELETE', token }),

  // Simulacros: gestión de bloques
  createSimulacroBloque: (token, simulacroId, payload) =>
    apiRequest(`/admin/simulacros/${simulacroId}/bloques`, { method: 'POST', body: payload, token }),
  updateSimulacroBloque: (token, simulacroId, bloqueId, payload) =>
    apiRequest(`/admin/simulacros/${simulacroId}/bloques/${bloqueId}`, { method: 'PUT', body: payload, token }),
  deleteSimulacroBloque: (token, simulacroId, bloqueId) =>
    apiRequest(`/admin/simulacros/${simulacroId}/bloques/${bloqueId}`, { method: 'DELETE', token }),

  // Simulacros: gestión de preguntas en bloques
  asignarPreguntasBloque: (token, simulacroId, bloqueId, preguntaIds) =>
    apiRequest(`/admin/simulacros/${simulacroId}/bloques/${bloqueId}/preguntas`, { method: 'POST', body: { pregunta_ids: preguntaIds }, token }),
  quitarPreguntaBloque: (token, simulacroId, bloqueId, preguntaId) =>
    apiRequest(`/admin/simulacros/${simulacroId}/bloques/${bloqueId}/preguntas/${preguntaId}`, { method: 'DELETE', token }),

  // Admin Tests (tests curados por admin/profesor)
  listTests: (token, query = {}) =>
    apiRequest('/admin/tests', { token, query }),
  getTest: (token, id) =>
    apiRequest(`/admin/tests/${id}`, { token }),
  createTest: (token, payload) =>
    apiRequest('/admin/tests', { method: 'POST', body: payload, token }),
  updateTest: (token, id, payload) =>
    apiRequest(`/admin/tests/${id}`, { method: 'PUT', body: payload, token }),
  deleteTest: (token, id) =>
    apiRequest(`/admin/tests/${id}`, { method: 'DELETE', token }),
  addPreguntasTest: (token, testId, preguntaIds) =>
    apiRequest(`/admin/tests/${testId}/preguntas`, { method: 'POST', body: { pregunta_ids: preguntaIds }, token }),
  removePreguntaTest: (token, testId, preguntaId) =>
    apiRequest(`/admin/tests/${testId}/preguntas/${preguntaId}`, { method: 'DELETE', token }),
  seleccionarPreguntasAdmin: (token, payload) =>
    apiRequest('/admin/tests/seleccion/preguntas', { method: 'POST', body: payload, token }),

  // Etiquetas
  listEtiquetas: (token, query = {}) =>
    apiRequest('/admin/etiquetas', { token, query }),
  createEtiqueta: (token, payload) =>
    apiRequest('/admin/etiquetas', { method: 'POST', body: payload, token }),
  updateEtiqueta: (token, id, payload) =>
    apiRequest(`/admin/etiquetas/${id}`, { method: 'PUT', body: payload, token }),
  deleteEtiqueta: (token, id) =>
    apiRequest(`/admin/etiquetas/${id}`, { method: 'DELETE', token }),

  // Stats mejoradas (B5+B6)
  getAdminStatsFull: (token) =>
    apiRequest('/admin/stats/full', { token }),
  getDistribucionContenido: (token) =>
    apiRequest('/admin/stats/contenido', { token }),
  getTopOposiciones: (token, limit = 5) =>
    apiRequest('/admin/stats/top-oposiciones', { token, query: { limit } }),
  getEvolucionUsuarios: (token, dias = 30) =>
    apiRequest('/admin/stats/evolucion-usuarios', { token, query: { dias } }),
  getActividadReciente: (token, limit = 20) =>
    apiRequest('/admin/actividad', { token, query: { limit } }),

  // Ajustes del sistema (email + Stripe)
  getSettings: (token) =>
    apiRequest('/admin/settings', { token }),
  updateEmailSettings: (token, payload) =>
    apiRequest('/admin/settings/email', { method: 'PATCH', body: payload, token }),
  updateStripeSettings: (token, payload) =>
    apiRequest('/admin/settings/stripe', { method: 'PATCH', body: payload, token }),
  testEmailSettings: (token, destinatario) =>
    apiRequest('/admin/settings/email/test', { method: 'POST', body: { destinatario }, token }),

  // Imagen de pregunta
  uploadImagenPregunta: async (token, preguntaId, file) => {
    const formData = new FormData();
    formData.append('imagen', file);
    const response = await fetch(`${API_URL}/admin/preguntas/${preguntaId}/imagen`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message || 'Error al subir imagen');
    return payload?.data ?? null;
  },
  deleteImagenPregunta: (token, preguntaId) =>
    apiRequest(`/admin/preguntas/${preguntaId}/imagen`, { method: 'DELETE', token }),
  getMediaBrowser: (token) =>
    apiRequest('/admin/media/preguntas', { token }),

  // Audio de pregunta
  uploadAudioPregunta: async (token, preguntaId, blob) => {
    const formData = new FormData();
    formData.append('audio', blob, 'grabacion.webm');
    const response = await fetch(`${API_URL}/admin/preguntas/${preguntaId}/audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message || 'Error al subir audio');
    return payload?.data ?? null;
  },
  deleteAudioPregunta: (token, preguntaId) =>
    apiRequest(`/admin/preguntas/${preguntaId}/audio`, { method: 'DELETE', token }),
  getAudioBrowser: (token) =>
    apiRequest('/admin/media/audios', { token }),
};
