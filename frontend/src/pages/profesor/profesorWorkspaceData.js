import { profesorApi } from '../../services/profesorApi';

const valueOf = (result, fallback) => (result.status === 'fulfilled' ? result.value : fallback);

export const getItems = (response) => {
  const raw = response?.items ?? response?.data ?? response;
  return Array.isArray(raw) ? raw : [];
};
export const getTotal = (response) => response?.pagination?.total ?? response?.total ?? getItems(response).length ?? 0;

export async function loadProfesorWorkspace(token, query = {}) {
  const cleanQuery = {
    ...(query.oposicion_id ? { oposicion_id: query.oposicion_id } : {}),
  };

  const workspaceDashboard = await profesorApi.getWorkspaceDashboard(token, cleanQuery);
  const [preguntasRes, reportesRes, testsRes, simulacrosRes] = await Promise.allSettled([
    profesorApi.getMisPreguntas(token, { page: 1, page_size: 60, ...cleanQuery }),
    profesorApi.listReportes(token, { page: 1, page_size: 20 }),
    profesorApi.getMisTests(token, { page: 1, page_size: 50, ...cleanQuery }),
    profesorApi.getMisSimulacros(token, { page: 1, page_size: 50, ...cleanQuery }),
  ]);

  const preguntasResponse = valueOf(preguntasRes, {});
  const reportesResponse = valueOf(reportesRes, {});
  const testsResponse = valueOf(testsRes, {});
  const simulacrosResponse = valueOf(simulacrosRes, {});

  const preguntas = getItems(preguntasResponse);
  const reportes = getItems(reportesResponse);
  const tests = getItems(testsResponse);
  const simulacros = getItems(simulacrosResponse);

  return {
    oposiciones: workspaceDashboard.oposiciones ?? [],
    stats: workspaceDashboard.stats ?? {},
    kpis: workspaceDashboard.kpis ?? {},
    evolucion: workspaceDashboard.evolucion ?? [],
    actividad: workspaceDashboard.actividad ?? [],
    alertas: workspaceDashboard.alertas ?? [],
    preguntas,
    reportes,
    tests,
    simulacros,
    totals: {
      preguntas: workspaceDashboard.totals?.preguntas ?? getTotal(preguntasResponse),
      reportes: workspaceDashboard.totals?.reportes ?? getTotal(reportesResponse),
      tests: workspaceDashboard.totals?.tests ?? getTotal(testsResponse),
      simulacros: workspaceDashboard.totals?.simulacros ?? getTotal(simulacrosResponse),
    },
  };
}

export function buildOposicionCards(workspace) {
  const oposiciones = workspace.oposiciones ?? [];
  const preguntasSource = workspace.preguntas ?? [];
  const simulacrosSource = workspace.simulacros ?? [];
  const testsSource = workspace.tests ?? [];

  return oposiciones.map((oposicion) => {
    const preguntas = preguntasSource.filter((p) => p.oposicion_nombre === oposicion.nombre).length;
    const simulacros = simulacrosSource.filter((s) => s.oposicion_id === oposicion.id || s.oposicion_nombre === oposicion.nombre).length;
    const tests = testsSource.filter((t) => t.oposicion_id === oposicion.id || t.oposicion_nombre === oposicion.nombre).length;
    const totalSimulacros = oposicion.simulacros ?? oposicion.total_simulacros ?? simulacros;

    return {
      ...oposicion,
      alumnos: oposicion.alumnosActivos ?? oposicion.alumnos_activos ?? 0,
      progreso: oposicion.progresoMedio ?? oposicion.progreso_medio ?? oposicion.mediaAciertos ?? oposicion.media_aciertos ?? 0,
      aciertos: oposicion.mediaAciertos ?? oposicion.media_aciertos ?? 0,
      preguntas: oposicion.preguntas ?? oposicion.total_preguntas ?? preguntas,
      tests: oposicion.plantillasTest ?? oposicion.total_plantillas_test ?? tests,
      simulacros: totalSimulacros,
      ultimoSimulacro: totalSimulacros > 0 ? `${totalSimulacros} activos` : 'Sin simulacros',
      categoria: oposicion.categoria ?? 'Oposición asignada',
    };
  });
}

export function buildAlerts(workspace) {
  if (workspace.alertas?.length) return workspace.alertas;

  const reportes = workspace.totals.reportes ?? 0;
  return [
    {
      level: reportes > 0 ? 'warning' : 'info',
      title: `${reportes} preguntas reportadas`,
      text: reportes > 0
        ? 'Hay incidencias pendientes de revisión.'
        : 'No hay incidencias abiertas en este momento.',
    },
  ];
}
