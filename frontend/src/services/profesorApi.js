import { apiRequest } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const profesorApi = {
  getMisOposiciones: (token) =>
    apiRequest('/profesor/mis-oposiciones', { token }),

  getMisPreguntas: (token, query = {}) =>
    apiRequest('/profesor/mis-preguntas', { token, query }),

  listReportes: (token, query = {}) =>
    apiRequest('/profesor/reportes', { token, query }),

  updateReporteEstado: (token, reporteId, estado, mensajeAdmin) =>
    apiRequest(`/profesor/reportes/${reporteId}/estado`, { method: 'PATCH', body: { estado, ...(mensajeAdmin ? { mensajeAdmin } : {}) }, token }),

  // Reutiliza endpoints admin (accesibles para profesor)
  createPregunta: (token, payload) =>
    apiRequest('/admin/preguntas', { method: 'POST', body: payload, token }),
  getPregunta: (token, id) =>
    apiRequest(`/admin/preguntas/${id}`, { token }),
  updatePregunta: (token, id, payload) =>
    apiRequest(`/admin/preguntas/${id}`, { method: 'PUT', body: payload, token }),
  deletePregunta: (token, id) =>
    apiRequest(`/admin/preguntas/${id}`, { method: 'DELETE', token }),
  importPreguntasCsv: (token, payload) =>
    apiRequest('/admin/preguntas/import', { method: 'POST', body: payload, token }),

  // Tests propios (B7)
  getMisTests: (token, query = {}) =>
    apiRequest('/profesor/mis-tests', { token, query }),
  getMiTest: (token, id) =>
    apiRequest(`/profesor/mis-tests/${id}`, { token }),
  createMiTest: (token, payload) =>
    apiRequest('/profesor/mis-tests', { method: 'POST', body: payload, token }),
  updateMiTest: (token, id, payload) =>
    apiRequest(`/profesor/mis-tests/${id}`, { method: 'PUT', body: payload, token }),
  deleteMiTest: (token, id) =>
    apiRequest(`/profesor/mis-tests/${id}`, { method: 'DELETE', token }),
  addPreguntasMiTest: (token, testId, preguntaIds) =>
    apiRequest(`/profesor/mis-tests/${testId}/preguntas`, { method: 'POST', body: { pregunta_ids: preguntaIds }, token }),
  removePreguntaMiTest: (token, testId, preguntaId) =>
    apiRequest(`/profesor/mis-tests/${testId}/preguntas/${preguntaId}`, { method: 'DELETE', token }),
  setDemoMiTest: (token, testId, esDemo) =>
    apiRequest(`/profesor/mis-tests/${testId}/demo`, { method: 'PATCH', body: { es_demo: esDemo }, token }),

  // Simulacros propios (B8)
  getMisSimulacros: (token, query = {}) =>
    apiRequest('/profesor/mis-simulacros', { token, query }),
  getMiSimulacro: (token, id) =>
    apiRequest(`/profesor/mis-simulacros/${id}`, { token }),
  createMiSimulacro: (token, payload) =>
    apiRequest('/profesor/mis-simulacros', { method: 'POST', body: payload, token }),
  updateMiSimulacro: (token, id, payload) =>
    apiRequest(`/profesor/mis-simulacros/${id}`, { method: 'PUT', body: payload, token }),
  deleteMiSimulacro: (token, id) =>
    apiRequest(`/profesor/mis-simulacros/${id}`, { method: 'DELETE', token }),
  createMiSimulacroBloque: (token, simulacroId, payload) =>
    apiRequest(`/profesor/mis-simulacros/${simulacroId}/bloques`, { method: 'POST', body: payload, token }),
  updateMiSimulacroBloque: (token, simulacroId, bloqueId, payload) =>
    apiRequest(`/profesor/mis-simulacros/${simulacroId}/bloques/${bloqueId}`, { method: 'PUT', body: payload, token }),
  deleteMiSimulacroBloque: (token, simulacroId, bloqueId) =>
    apiRequest(`/profesor/mis-simulacros/${simulacroId}/bloques/${bloqueId}`, { method: 'DELETE', token }),
  asignarPreguntasMiSimulacro: (token, simulacroId, bloqueId, preguntaIds) =>
    apiRequest(`/profesor/mis-simulacros/${simulacroId}/bloques/${bloqueId}/preguntas`, { method: 'POST', body: { pregunta_ids: preguntaIds }, token }),
  quitarPreguntaMiSimulacro: (token, simulacroId, bloqueId, preguntaId) =>
    apiRequest(`/profesor/mis-simulacros/${simulacroId}/bloques/${bloqueId}/preguntas/${preguntaId}`, { method: 'DELETE', token }),

  listPlanificacion: (token, query = {}) =>
    apiRequest('/profesor/workspace/planificacion', { token, query }),
  getPlanificacionResultados: (token, id, query = {}) =>
    apiRequest(`/profesor/workspace/planificacion/${id}/resultados`, { token, query }),
  recordarPlanificacionPendientes: (token, id) =>
    apiRequest(`/profesor/workspace/planificacion/${id}/recordatorio`, { method: 'POST', token }),
  getWorkspaceDashboard: (token, query = {}) =>
    apiRequest('/profesor/workspace/dashboard', { token, query }),
  getWorkspaceOposiciones: (token) =>
    apiRequest('/profesor/workspace/oposiciones', { token }),
  getWorkspaceOposicion: (token, id) =>
    apiRequest(`/profesor/workspace/oposiciones/${id}`, { token }),
  getWorkspaceTemario: (token, query = {}) =>
    apiRequest('/profesor/workspace/temario', { token, query }),
  getWorkspaceTema: (token, temaId) =>
    apiRequest(`/profesor/workspace/temas/${temaId}`, { token }),
  getWorkspaceAlumnos: (token, query = {}) =>
    apiRequest('/profesor/workspace/alumnos', { token, query }),
  getWorkspaceAlumno: (token, id, query = {}) =>
    apiRequest(`/profesor/workspace/alumnos/${id}`, { token, query }),
  getWorkspaceEstadisticas: (token, query = {}) =>
    apiRequest('/profesor/workspace/estadisticas', { token, query }),
  getWorkspaceActividad: (token, query = {}) =>
    apiRequest('/profesor/workspace/actividad', { token, query }),
  getPreguntasProblematicas: (token, query = {}) =>
    apiRequest('/profesor/workspace/preguntas-problematicas', { token, query }),
  createPlanificacion: (token, payload) =>
    apiRequest('/profesor/workspace/planificacion', { method: 'POST', body: payload, token }),
  updatePlanificacion: (token, id, payload) =>
    apiRequest(`/profesor/workspace/planificacion/${id}`, { method: 'PUT', body: payload, token }),
  archivePlanificacion: (token, id) =>
    apiRequest(`/profesor/workspace/planificacion/${id}`, { method: 'DELETE', token }),
  seleccionarPreguntas: (token, payload) =>
    apiRequest('/profesor/workspace/seleccion/preguntas', { method: 'POST', body: payload, token }),

  getMediaBrowser: (token) =>
    apiRequest('/profesor/media/preguntas', { token }),
  getAudioBrowser: (token) =>
    apiRequest('/profesor/media/audios', { token }),
  uploadImagenPregunta: async (token, preguntaId, file) => {
    const formData = new FormData();
    formData.append('imagen', file);
    const response = await fetch(`${API_URL}/profesor/preguntas/${preguntaId}/imagen`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message || 'Error al subir imagen');
    return payload?.data ?? null;
  },
  deleteImagenPregunta: (token, preguntaId) =>
    apiRequest(`/profesor/preguntas/${preguntaId}/imagen`, { method: 'DELETE', token }),
  uploadAudioPregunta: async (token, preguntaId, blob) => {
    const formData = new FormData();
    formData.append('audio', blob, 'grabacion.webm');
    const response = await fetch(`${API_URL}/profesor/preguntas/${preguntaId}/audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message || 'Error al subir audio');
    return payload?.data ?? null;
  },
  deleteAudioPregunta: (token, preguntaId) =>
    apiRequest(`/profesor/preguntas/${preguntaId}/audio`, { method: 'DELETE', token }),
};
