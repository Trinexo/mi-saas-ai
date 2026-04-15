import { apiRequest } from './api';

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

  // Catálogo: materias
  createMateria: (token, payload) => apiRequest('/admin/catalogo/materias', { method: 'POST', body: payload, token }),
  updateMateria: (token, id, payload) => apiRequest(`/admin/catalogo/materias/${id}`, { method: 'PUT', body: payload, token }),
  deleteMateria: (token, id) => apiRequest(`/admin/catalogo/materias/${id}`, { method: 'DELETE', token }),

  // Catálogo: temas
  createTema: (token, payload) => apiRequest('/admin/catalogo/temas', { method: 'POST', body: payload, token }),
  updateTema: (token, id, payload) => apiRequest(`/admin/catalogo/temas/${id}`, { method: 'PUT', body: payload, token }),
  deleteTema: (token, id) => apiRequest(`/admin/catalogo/temas/${id}`, { method: 'DELETE', token }),

  // Stats globales
  getAdminStats: (token) => apiRequest('/admin/stats', { token }),
  getTemasConMasErrores: (token, limit = 10) =>
    apiRequest('/admin/stats/temas-errores', { token, query: { limit } }),

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

  // Ajustes del sistema (email + Stripe)
  getSettings: (token) =>
    apiRequest('/admin/settings', { token }),
  updateEmailSettings: (token, payload) =>
    apiRequest('/admin/settings/email', { method: 'PATCH', body: payload, token }),
  updateStripeSettings: (token, payload) =>
    apiRequest('/admin/settings/stripe', { method: 'PATCH', body: payload, token }),
  testEmailSettings: (token, destinatario) =>
    apiRequest('/admin/settings/email/test', { method: 'POST', body: { destinatario }, token }),
};