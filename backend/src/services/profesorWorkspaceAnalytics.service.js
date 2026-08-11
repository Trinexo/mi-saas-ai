import { profesorWorkspaceAnalyticsRepository } from '../repositories/profesorWorkspaceAnalytics.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { accessContextService, contextoEsOperativo, normalizarIdentificador } from './accessContext.service.js';
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

const dashboardKpiDefaults = {
  alumnos_activos: 0,
  tests_realizados_hoy: 0,
  media_aciertos: 0,
  simulacros_completados: 0,
  preguntas_pendientes_revision: 0,
};

const safeDashboardPart = async (label, promise, fallback) => {
  try {
    const result = await promise;
    return result ?? fallback;
  } catch (error) {
    console.error(`[profesor-workspace-dashboard] ${label}:`, error.message);
    return fallback;
  }
};

export const profesorWorkspaceAnalyticsService = {
  async assertOposicion(userId, oposicionId) {
    if (!oposicionId) return;
    const allowed = await profesorAccessRepository.hasAssignedOposicion(userId, oposicionId);
    if (!allowed) throw new ApiError(403, 'No tienes asignada esa oposicion');
  },

  normalizeOposicion(row) {
    const { alumnos_ids: _alumnosIds, acceso_oposicion_ids: _accesoIds, ...safeRow } = row;
    return {
      ...safeRow,
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

  async canonicalizeOposiciones(userId, rows = []) {
    return Promise.all(rows.map(async (row) => {
      const usuarioIds = row.alumnos_ids ?? [];
      if (usuarioIds.length === 0) return { ...row, alumnos_activos: 0 };
      const contextos = await accessContextService.obtenerContextosUsuariosOposicion({
        usuarioIds,
        oposicionId: row.id,
        principal: { tipo: 'profesor', usuarioId: userId },
      });
      return {
        ...row,
        alumnos_activos: contextos.filter((contexto) => contextoEsOperativo(contexto)).length,
      };
    }));
  },

  async canonicalizeKpis(userId, oposicionId, kpis = {}) {
    const usuarioIds = kpis.alumnos_ids ?? [];
    if (usuarioIds.length === 0) return { ...kpis, alumnos_activos: 0 };
    const oposiciones = oposicionId == null
      ? await profesorAccessRepository.listAssignedOposicionIds(userId)
      : [oposicionId];
    const contextos = [];
    for (const id of oposiciones) {
      contextos.push(...await accessContextService.obtenerContextosUsuariosOposicion({
        usuarioIds,
        oposicionId: id,
        principal: { tipo: 'profesor', usuarioId: userId },
      }));
    }
    const activos = new Set(contextos
      .filter((contexto) => contextoEsOperativo(contexto))
      .map((contexto) => String(contexto.usuario_id)));
    const { alumnos_ids: _alumnosIds, ...safeKpis } = kpis;
    return { ...safeKpis, alumnos_activos: activos.size };
  },

  async dashboard(userId, query = {}) {
    const oposicionId = query.oposicion_id ?? null;
    await this.assertOposicion(userId, oposicionId);
    const [rawKpis, rawOposiciones, evolucion, actividad, problematicas] = await Promise.all([
      safeDashboardPart('kpis', profesorWorkspaceAnalyticsRepository.getDashboardKpis(userId, oposicionId), dashboardKpiDefaults),
      safeDashboardPart('oposiciones', profesorWorkspaceAnalyticsRepository.listOposiciones(userId), []),
      safeDashboardPart('evolucion', profesorWorkspaceAnalyticsRepository.getEvolucion(userId, oposicionId, 30), []),
      safeDashboardPart('actividad', profesorWorkspaceAnalyticsRepository.getActividadReciente(userId, 8, oposicionId), []),
      safeDashboardPart('preguntas-problematicas', profesorWorkspaceAnalyticsRepository.getPreguntasProblematicas(userId, { oposicionId, limit: 5, offset: 0 }), []),
    ]);
    const [kpis, oposiciones] = await Promise.all([
      this.canonicalizeKpis(userId, oposicionId, rawKpis),
      this.canonicalizeOposiciones(userId, rawOposiciones),
    ]);

    const filteredOposiciones = oposicionId
      ? oposiciones.filter((item) => BigInt(item.id) === BigInt(oposicionId))
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
    const rows = await this.canonicalizeOposiciones(
      userId,
      await profesorWorkspaceAnalyticsRepository.listOposiciones(userId),
    );
    return { items: rows.map((row) => this.normalizeOposicion(row)) };
  },

  async oposicionDetalle(userId, slug) {
    const row = await profesorWorkspaceAnalyticsRepository.getOposicionIdBySlug(userId, slug);
    if (!row) throw new ApiError(404, 'Oposicion no encontrada');
    const oposicionId = normalizarIdentificador(row.id, 'oposicionId');
    const [rawOposiciones, temario, problematicas, alumnos, simulacros] = await Promise.all([
      profesorWorkspaceAnalyticsRepository.listOposiciones(userId),
      profesorWorkspaceAnalyticsRepository.getTemario(userId, oposicionId),
      profesorWorkspaceAnalyticsRepository.getPreguntasProblematicas(userId, { oposicionId, limit: 8, offset: 0 }),
      profesorWorkspaceAnalyticsRepository.listAlumnos(userId, { oposicionId, limit: 5, offset: 0 }),
      profesorWorkspaceAnalyticsRepository.getSimulacrosActivos(userId, oposicionId, 5),
    ]);
    const oposiciones = await this.canonicalizeOposiciones(userId, rawOposiciones);
    const oposicion = oposiciones.find((item) => BigInt(item.id) === BigInt(oposicionId));
    if (!oposicion) throw new ApiError(404, 'Oposicion no encontrada');
    const alumnosCanonicos = await this.canonicalizeAlumnos(userId, alumnos.items);
    return {
      oposicion: this.normalizeOposicion(oposicion),
      temario,
      problematicas,
      alumnos: alumnosCanonicos.slice(0, 5).map((row) => this.normalizeAlumno(row)),
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

  async canonicalizeAlumnos(userId, rows = []) {
    const candidateIds = rows.map((row) => row.id);
    const oppositionIds = [...new Set(rows.flatMap((row) => row.acceso_oposicion_ids ?? [])
      .map((id) => String(normalizarIdentificador(id, 'oposicionId'))))];
    const contexts = new Map();
    for (const candidateOposicionId of oppositionIds) {
      const normalizedOposicionId = normalizarIdentificador(candidateOposicionId, 'oposicionId');
      const contextsForOpposition = await accessContextService.obtenerContextosUsuariosOposicion({
        usuarioIds: candidateIds,
        oposicionId: normalizedOposicionId,
        principal: { tipo: 'profesor', usuarioId: userId },
      });
      contextsForOpposition.forEach((contexto) => contexts.set(
        `${String(contexto.usuario_id)}:${String(contexto.oposicion_id)}`,
        contexto,
      ));
    }
    return rows
      .map((row) => {
        const visibles = (row.acceso_oposicion_ids ?? []).filter((id) => {
          const contexto = contexts.get(`${String(row.id)}:${String(id)}`);
          return contextoEsOperativo(contexto, { permitirPendiente: true });
        });
        if (visibles.length === 0) return null;
        return {
          ...row,
          oposiciones: row.oposiciones.filter((oposicion) => visibles.some(
            (id) => String(oposicion.id) === String(id),
          )),
        };
      })
      .filter(Boolean);
  },

  async alumnos(userId, query = {}) {
    const oposicionId = query.oposicion_id ?? null;
    await this.assertOposicion(userId, oposicionId);
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const result = await profesorWorkspaceAnalyticsRepository.listAlumnos(userId, {
      oposicionId,
      q: query.q ?? null,
      limit: null,
      offset: null,
    });
    const items = (await this.canonicalizeAlumnos(userId, result.items))
      .map((row) => this.normalizeAlumno(row))
      .sort((a, b) => b.rankingScore - a.rankingScore);
    const total = items.length;
    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      pagination: { page, pageSize, total },
    };
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
    const [evolucion, rawOposiciones, temario, alumnos, problematicas, dificultad] = await Promise.all([
      profesorWorkspaceAnalyticsRepository.getEvolucion(userId, oposicionId, days),
      profesorWorkspaceAnalyticsRepository.listOposiciones(userId),
      profesorWorkspaceAnalyticsRepository.getTemario(userId, oposicionId),
      profesorWorkspaceAnalyticsRepository.listAlumnos(userId, { oposicionId, limit: 10, offset: 0 }),
      profesorWorkspaceAnalyticsRepository.getPreguntasProblematicas(userId, { oposicionId, limit: 10, offset: 0 }),
      profesorWorkspaceAnalyticsRepository.getDistribucionDificultad(userId, oposicionId),
    ]);
    const oposiciones = await this.canonicalizeOposiciones(userId, rawOposiciones);
    const filteredOposiciones = oposicionId
      ? oposiciones.filter((item) => BigInt(item.id) === BigInt(oposicionId))
      : oposiciones;
    const alumnosCanonicos = await this.canonicalizeAlumnos(userId, alumnos.items);
    return {
      evolucion,
      rendimientoPorOposicion: filteredOposiciones.map((row) => this.normalizeOposicion(row)),
      rendimientoPorTema: temario,
      rankingAlumnos: alumnosCanonicos.map((row) => this.normalizeAlumno(row))
        .sort((a, b) => b.rankingScore - a.rankingScore),
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
