import { profesorWorkspaceAnalyticsRepository } from '../repositories/profesorWorkspaceAnalytics.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { ApiError } from '../utils/api-error.js';

const riskFrom = ({ mediaAciertos, ultimaActividad }) => {
  const media = Number(mediaAciertos ?? 0);
  if (!ultimaActividad) return 'alto';
  const days = (Date.now() - new Date(ultimaActividad).getTime()) / 86400000;
  if (days > 14 || media < 45) return 'alto';
  if (days > 7 || media < 60) return 'medio';
  return 'bajo';
};

const scoreRanking = (student) => {
  const rendimiento = Number(student.media_aciertos ?? 0);
  const actividad = Math.min(100, Number(student.tests_realizados ?? 0) * 5);
  const evolucion = student.ultima_actividad ? 80 : 20;
  return Math.round((rendimiento * 0.6) + (actividad * 0.25) + (evolucion * 0.15));
};

export const profesorWorkspaceAnalyticsService = {
  async assertOposicion(userId, oposicionId) {
    if (!oposicionId) return;
    const allowed = await profesorAccessRepository.hasAssignedOposicion(userId, oposicionId);
    if (!allowed) throw new ApiError(403, 'No tienes asignada esa oposicion');
  },

  normalizeOposicion(row) {
    return {
      ...row,
      alumnosActivos: Number(row.alumnos_activos ?? 0),
      preguntas: Number(row.total_preguntas ?? 0),
      plantillasTest: Number(row.total_plantillas_test ?? 0),
      tests: Number(row.total_plantillas_test ?? 0),
      simulacros: Number(row.total_simulacros ?? 0),
      reportesAbiertos: Number(row.reportes_abiertos ?? 0),
      mediaAciertos: Number(row.media_aciertos ?? 0),
      progresoMedio: Number(row.media_aciertos ?? 0),
    };
  },

  async dashboard(userId, query = {}) {
    const oposicionId = query.oposicion_id ?? null;
    await this.assertOposicion(userId, oposicionId);
    const [kpis, oposiciones, evolucion, actividad, problematicas] = await Promise.all([
      profesorWorkspaceAnalyticsRepository.getDashboardKpis(userId, oposicionId),
      profesorWorkspaceAnalyticsRepository.listOposiciones(userId),
      profesorWorkspaceAnalyticsRepository.getEvolucion(userId, oposicionId, 30),
      profesorWorkspaceAnalyticsRepository.getActividadReciente(userId, 8, oposicionId),
      profesorWorkspaceAnalyticsRepository.getPreguntasProblematicas(userId, { oposicionId, limit: 5, offset: 0 }),
    ]);

    const filteredOposiciones = oposicionId
      ? oposiciones.filter((item) => Number(item.id) === Number(oposicionId))
      : oposiciones;

    return {
      kpis,
      stats: {
        total: filteredOposiciones.reduce((acc, item) => acc + Number(item.total_preguntas ?? 0), 0),
      },
      totals: {
        preguntas: filteredOposiciones.reduce((acc, item) => acc + Number(item.total_preguntas ?? 0), 0),
        reportes: Number(kpis.preguntas_pendientes_revision ?? 0),
        tests: Number(kpis.tests_realizados_hoy ?? 0),
        simulacros: Number(kpis.simulacros_completados ?? 0),
      },
      oposiciones: filteredOposiciones.map((row) => this.normalizeOposicion(row)),
      evolucion,
      actividad,
      alertas: this.buildAlertas(kpis, problematicas),
    };
  },

  async oposiciones(userId) {
    const rows = await profesorWorkspaceAnalyticsRepository.listOposiciones(userId);
    return { items: rows.map((row) => this.normalizeOposicion(row)) };
  },

  async oposicionDetalle(userId, slug) {
    const row = await profesorWorkspaceAnalyticsRepository.getOposicionIdBySlug(userId, slug);
    if (!row) throw new ApiError(404, 'Oposicion no encontrada');
    const oposicionId = Number(row.id);
    const [oposiciones, temario, problematicas, alumnos, simulacros] = await Promise.all([
      profesorWorkspaceAnalyticsRepository.listOposiciones(userId),
      profesorWorkspaceAnalyticsRepository.getTemario(userId, oposicionId),
      profesorWorkspaceAnalyticsRepository.getPreguntasProblematicas(userId, { oposicionId, limit: 8, offset: 0 }),
      profesorWorkspaceAnalyticsRepository.listAlumnos(userId, { oposicionId, limit: 5, offset: 0 }),
      profesorWorkspaceAnalyticsRepository.getSimulacrosActivos(userId, oposicionId, 5),
    ]);
    const oposicion = oposiciones.find((item) => Number(item.id) === Number(oposicionId));
    if (!oposicion) throw new ApiError(404, 'Oposicion no encontrada');
    return {
      oposicion: this.normalizeOposicion(oposicion),
      temario,
      problematicas,
      alumnos: alumnos.items.map(this.normalizeAlumno),
      simulacros,
    };
  },

  async temario(userId, query = {}) {
    const oposicionId = query.oposicion_id ?? null;
    await this.assertOposicion(userId, oposicionId);
    const items = await profesorWorkspaceAnalyticsRepository.getTemario(userId, oposicionId);
    return { items };
  },

  async temaDetalle(userId, temaId) {
    const data = await profesorWorkspaceAnalyticsRepository.getTemaDetalle(userId, temaId);
    if (!data.tema) throw new ApiError(404, 'Tema no encontrado o sin acceso');
    return data;
  },

  normalizeAlumno(row) {
    const normalized = {
      ...row,
      mediaAciertos: Number(row.media_aciertos ?? 0),
      testsRealizados: Number(row.tests_realizados ?? 0),
      simulacrosRealizados: Number(row.simulacros_realizados ?? 0),
      progreso: Number(row.media_aciertos ?? 0),
      riesgo: riskFrom({ mediaAciertos: row.media_aciertos, ultimaActividad: row.ultima_actividad }),
    };
    normalized.rankingScore = scoreRanking(row);
    return normalized;
  },

  async alumnos(userId, query = {}) {
    const oposicionId = query.oposicion_id ?? null;
    await this.assertOposicion(userId, oposicionId);
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const result = await profesorWorkspaceAnalyticsRepository.listAlumnos(userId, {
      oposicionId,
      q: query.q ?? null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    const items = result.items.map(this.normalizeAlumno).sort((a, b) => b.rankingScore - a.rankingScore);
    return { items, pagination: { page, pageSize, total: result.total } };
  },

  async alumnoDetalle(userId, alumnoId, query = {}) {
    const oposicionId = query.oposicion_id ?? null;
    await this.assertOposicion(userId, oposicionId);
    const allowed = await profesorAccessRepository.canAccessAlumno(userId, alumnoId, oposicionId);
    if (!allowed) throw new ApiError(403, 'No tienes acceso a este alumno');
    const [alumno, progresoPorTema, ultimosTests] = await Promise.all([
      profesorWorkspaceAnalyticsRepository.getAlumnoDetalle(userId, alumnoId, oposicionId),
      profesorWorkspaceAnalyticsRepository.getAlumnoProgresoPorTema(userId, alumnoId, oposicionId),
      profesorWorkspaceAnalyticsRepository.getAlumnoUltimosTests(userId, alumnoId, oposicionId, 10),
    ]);
    if (!alumno) throw new ApiError(404, 'Alumno no encontrado');
    return {
      alumno: this.normalizeAlumno(alumno),
      progresoPorTema,
      ultimosTests,
    };
  },

  async estadisticas(userId, query = {}) {
    const oposicionId = query.oposicion_id ?? null;
    const days = query.dias ?? 30;
    await this.assertOposicion(userId, oposicionId);
    const [evolucion, oposiciones, temario, alumnos, problematicas, dificultad] = await Promise.all([
      profesorWorkspaceAnalyticsRepository.getEvolucion(userId, oposicionId, days),
      profesorWorkspaceAnalyticsRepository.listOposiciones(userId),
      profesorWorkspaceAnalyticsRepository.getTemario(userId, oposicionId),
      profesorWorkspaceAnalyticsRepository.listAlumnos(userId, { oposicionId, limit: 10, offset: 0 }),
      profesorWorkspaceAnalyticsRepository.getPreguntasProblematicas(userId, { oposicionId, limit: 10, offset: 0 }),
      profesorWorkspaceAnalyticsRepository.getDistribucionDificultad(userId, oposicionId),
    ]);
    const filteredOposiciones = oposicionId
      ? oposiciones.filter((item) => Number(item.id) === Number(oposicionId))
      : oposiciones;
    return {
      evolucion,
      rendimientoPorOposicion: filteredOposiciones.map((row) => this.normalizeOposicion(row)),
      rendimientoPorTema: temario,
      rankingAlumnos: alumnos.items.map(this.normalizeAlumno).sort((a, b) => b.rankingScore - a.rankingScore),
      preguntasProblematicas: problematicas,
      distribucionDificultad: dificultad,
    };
  },

  async preguntasProblematicas(userId, query = {}) {
    const oposicionId = query.oposicion_id ?? null;
    await this.assertOposicion(userId, oposicionId);
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const items = await profesorWorkspaceAnalyticsRepository.getPreguntasProblematicas(userId, {
      oposicionId,
      temaId: query.tema_id ?? null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return { items, pagination: { page, pageSize, total: items.length } };
  },

  async actividadFeed(userId, query = {}) {
    const oposicionId = query.oposicion_id ?? null;
    await this.assertOposicion(userId, oposicionId);
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const rows = await profesorWorkspaceAnalyticsRepository.getActividadFeed(userId, {
      tipo: query.tipo ?? null,
      oposicionId,
      alumnoId: query.alumno_id ?? null,
      fechaDesde: query.desde ?? null,
      fechaHasta: query.hasta ?? null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    const total = rows[0]?.total ?? 0;
    return {
      items: rows.map(({ total: _t, ...r }) => ({
        ...r,
        aciertos: r.aciertos != null ? Number(r.aciertos) : null,
        errores: r.errores != null ? Number(r.errores) : null,
        nota: r.nota != null ? Number(r.nota) : null,
      })),
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  },

  buildAlertas(kpis, problematicas) {
    const alerts = [];
    const reportes = Number(kpis.preguntas_pendientes_revision ?? 0);
    if (reportes > 0) {
      alerts.push({
        level: 'warning',
        title: `${reportes} preguntas pendientes de revision`,
        text: 'Hay reportes abiertos en tus oposiciones asignadas.',
      });
    }
    if (problematicas.length > 0) {
      alerts.push({
        level: 'danger',
        title: 'Preguntas problematicas detectadas',
        text: `${problematicas.length} preguntas requieren revision por reportes o tasa de fallo.`,
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        level: 'info',
        title: 'Workspace al dia',
        text: 'No hay alertas academicas relevantes en este momento.',
      });
    }
    return alerts;
  },
};
