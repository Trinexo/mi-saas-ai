import { profesorWorkspaceSeleccionRepository } from '../repositories/profesorWorkspaceSeleccion.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { ApiError } from '../utils/api-error.js';
import { adminSimulacrosService } from './adminSimulacros.service.js';

const uniqNumbers = (items = []) => [...new Set(items.map(Number).filter(Boolean))];
const getExamenIds = (payload = {}) => payload.examen_ids?.length
  ? payload.examen_ids
  : (payload.examen_id != null ? [payload.examen_id] : []);

const buildTemaRequests = (payload) => {
  if (payload.temas?.length) {
    return payload.temas.map((item) => ({
      temaId: Number(item.tema_id),
      cantidad: Number(item.cantidad),
    }));
  }

  const temaIds = uniqNumbers(payload.tema_ids);
  const total = Number(payload.cantidad);
  const base = Math.floor(total / temaIds.length);
  let resto = total % temaIds.length;

  return temaIds.map((temaId) => {
    const cantidad = base + (resto > 0 ? 1 : 0);
    resto -= 1;
    return { temaId, cantidad };
  });
};

async function seleccionarSinReparto(payload) {
  const exclude = new Set(uniqNumbers(payload.exclude_ids));
  const candidates = [];
  const seen = new Set(exclude);
  for (const temaId of uniqNumbers(payload.tema_ids)) {
    const rows = await profesorWorkspaceSeleccionRepository.listPreguntasDisponibles({
      oposicionId: payload.oposicion_id,
      temaId,
      cantidad: Number(payload.cantidad),
      dificultad: payload.dificultad,
      excludeIds: [...exclude],
      officialidad: payload.officialidad,
      anioIds: payload.anio_ids,
      examenId: payload.examen_id,
      examenIds: getExamenIds(payload),
    });
    rows.forEach((row) => {
      const id = Number(row.id);
      if (!seen.has(id)) { seen.add(id); candidates.push(row); }
    });
  }
  const cantidad = Number(payload.cantidad);
  const avisos = candidates.length < cantidad
    ? [{
      tipo: 'preguntas_insuficientes_global',
      mensaje: `Necesitas ${cantidad} preguntas y hay ${candidates.length} disponibles con los filtros seleccionados.`,
      faltantes: cantidad - candidates.length,
    }]
    : [];
  candidates.sort(() => Math.random() - 0.5);
  const preguntas = candidates.slice(0, cantidad);
  const grupos = new Map();
  preguntas.forEach((pregunta) => {
    const key = Number(pregunta.tema_id);
    if (!grupos.has(key)) grupos.set(key, { tema_id: key, tema_nombre: pregunta.tema_nombre, preguntas: [] });
    grupos.get(key).preguntas.push(pregunta);
  });
  return { preguntas, grupos: [...grupos.values()], resumen_temas: [], total_seleccionadas: preguntas.length, avisos };
}

async function validateScopeAndExclusions(payload) {
  const temaIds = uniqNumbers(payload.tema_ids);
  const validTemaIds = await profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion(payload.oposicion_id, temaIds);
  if (validTemaIds.length !== temaIds.length) {
    throw new ApiError(400, 'Todos los temas deben pertenecer a la oposicion indicada');
  }
  const [plantillaIds, simulacroIds] = await Promise.all([
    profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla(payload.plantilla_test_id),
    profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro(payload.simulacro_id),
  ]);
  return [...new Set([...uniqNumbers(payload.exclude_ids), ...plantillaIds, ...simulacroIds])];
}

export const profesorWorkspaceSeleccionService = {
  async seleccionar(userId, payload) {
    const hasOposicion = await profesorAccessRepository.hasAssignedOposicion(userId, payload.oposicion_id);
    if (!hasOposicion) throw new ApiError(403, 'No tienes asignada esa oposicion');

    await adminSimulacrosService.assertConfigOfficialFilters(payload, payload.oposicion_id);

    if (payload.plantilla_test_id) {
      const allowed = await profesorAccessRepository.hasAssignedPlantillaTest(userId, payload.plantilla_test_id);
      if (!allowed) throw new ApiError(403, 'No tienes acceso a esa plantilla de test');
    }

    if (payload.simulacro_id) {
      const allowed = await profesorAccessRepository.hasAssignedSimulacro(userId, payload.simulacro_id);
      if (!allowed) throw new ApiError(403, 'No tienes acceso a ese simulacro');
    }

    if (payload.reparto_por_tema === false) {
      const excludeIds = await validateScopeAndExclusions(payload);
      return seleccionarSinReparto({ ...payload, exclude_ids: excludeIds });
    }

    const temaRequests = buildTemaRequests(payload);
    const temaIds = uniqNumbers(temaRequests.map((item) => item.temaId));
    const validTemaIds = await profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion(payload.oposicion_id, temaIds);
    if (validTemaIds.length !== temaIds.length) {
      throw new ApiError(400, 'Todos los temas deben pertenecer a la oposicion indicada');
    }
    const temas = await profesorWorkspaceSeleccionRepository.listTemasInOposicion(payload.oposicion_id, temaIds);
    const nombresTema = new Map(temas.map((tema) => [Number(tema.id), tema.nombre]));

    const exclude = new Set(uniqNumbers(payload.exclude_ids));
    const [plantillaIds, simulacroIds] = await Promise.all([
      profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla(payload.plantilla_test_id),
      profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro(payload.simulacro_id),
    ]);
    [...plantillaIds, ...simulacroIds].forEach((id) => exclude.add(Number(id)));

    const seleccionadas = [];
    const avisos = [];
    const resumenTemas = [];

    for (const request of temaRequests) {
      const excludeIds = [...exclude];
      const [disponibles, preguntas] = await Promise.all([
        profesorWorkspaceSeleccionRepository.countDisponibles({
          oposicionId: payload.oposicion_id,
          temaId: request.temaId,
          dificultad: payload.dificultad,
          excludeIds,
          officialidad: payload.officialidad,
          anioIds: payload.anio_ids,
          examenId: payload.examen_id,
          examenIds: getExamenIds(payload),
        }),
        profesorWorkspaceSeleccionRepository.listPreguntasDisponibles({
          oposicionId: payload.oposicion_id,
          temaId: request.temaId,
          cantidad: request.cantidad,
          dificultad: payload.dificultad,
          excludeIds,
          officialidad: payload.officialidad,
          anioIds: payload.anio_ids,
          examenId: payload.examen_id,
          examenIds: getExamenIds(payload),
        }),
      ]);

      preguntas.forEach((pregunta) => exclude.add(Number(pregunta.id)));
      seleccionadas.push(...preguntas);

      const faltantes = Math.max(0, request.cantidad - preguntas.length);
      resumenTemas.push({
        tema_id: request.temaId,
        tema_nombre: nombresTema.get(request.temaId) ?? `Tema ${request.temaId}`,
        solicitadas: request.cantidad,
        disponibles,
        seleccionadas: preguntas.length,
        faltantes,
      });
      if (faltantes > 0) {
        avisos.push({
          tipo: 'preguntas_insuficientes',
          tema_id: request.temaId,
          mensaje: `Faltan ${faltantes} preguntas para completar el tema ${nombresTema.get(request.temaId) ?? `Tema ${request.temaId}`}`,
          faltantes,
        });
      }
    }

    if (payload.permitir_completar_con_otros_temas) {
      await this.completarFaltantes({ payload, temaRequests, resumenTemas, seleccionadas, exclude, avisos });
    }

    const byTema = new Map();
    for (const pregunta of seleccionadas) {
      const key = Number(pregunta.tema_id);
      if (!byTema.has(key)) {
        byTema.set(key, {
          tema_id: key,
          tema_nombre: pregunta.tema_nombre,
          preguntas: [],
        });
      }
      byTema.get(key).preguntas.push(pregunta);
    }

    return {
      preguntas: seleccionadas,
      grupos: [...byTema.values()],
      resumen_temas: resumenTemas,
      total_seleccionadas: seleccionadas.length,
      avisos,
    };
  },

  async completarFaltantes({ payload, temaRequests, resumenTemas, seleccionadas, exclude, avisos }) {
    let faltantesGlobal = resumenTemas.reduce((acc, tema) => acc + tema.faltantes, 0);
    if (faltantesGlobal <= 0) return;

    const temaIds = uniqNumbers(temaRequests.map((item) => item.temaId));
    const preguntas = await profesorWorkspaceSeleccionRepository.listPreguntasDisponiblesOposicion({
      oposicionId: payload.oposicion_id,
      cantidad: faltantesGlobal,
      dificultad: payload.dificultad,
      excludeIds: [...exclude],
      excludeTemaIds: temaIds,
      officialidad: payload.officialidad,
      anioIds: payload.anio_ids,
      examenId: payload.examen_id,
      examenIds: getExamenIds(payload),
    });

    preguntas.forEach((pregunta) => exclude.add(Number(pregunta.id)));
    seleccionadas.push(...preguntas);
    faltantesGlobal -= preguntas.length;

    if (faltantesGlobal <= 0) {
      avisos.push({
        tipo: 'faltantes_completados',
        mensaje: 'Las preguntas faltantes se completaron con otros temas de la misma oposicion',
      });
    } else {
      avisos.push({
        tipo: 'faltantes_sin_completar',
        mensaje: `No hay suficientes preguntas en la oposicion para completar ${faltantesGlobal} faltantes`,
        faltantes: faltantesGlobal,
      });
    }
  },

  // Igual que seleccionar() pero sin validaciones de acceso de profesor.
  // Solo para rutas protegidas por requireRole('admin').
  async seleccionarAdmin(payload) {
    await adminSimulacrosService.assertConfigOfficialFilters(payload, payload.oposicion_id);
    if (payload.reparto_por_tema === false) {
      const excludeIds = await validateScopeAndExclusions(payload);
      return seleccionarSinReparto({ ...payload, exclude_ids: excludeIds });
    }
    const temaRequests = buildTemaRequests(payload);
    const temaIds = uniqNumbers(temaRequests.map((item) => item.temaId));
    const validTemaIds = await profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion(payload.oposicion_id, temaIds);
    if (validTemaIds.length !== temaIds.length) {
      throw new ApiError(400, 'Todos los temas deben pertenecer a la oposicion indicada');
    }
    const temas = await profesorWorkspaceSeleccionRepository.listTemasInOposicion(payload.oposicion_id, temaIds);
    const nombresTema = new Map(temas.map((tema) => [Number(tema.id), tema.nombre]));

    const exclude = new Set(uniqNumbers(payload.exclude_ids));
    const [plantillaIds, simulacroIds] = await Promise.all([
      profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla(payload.plantilla_test_id),
      profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro(payload.simulacro_id),
    ]);
    [...plantillaIds, ...simulacroIds].forEach((id) => exclude.add(Number(id)));

    const seleccionadas = [];
    const avisos = [];
    const resumenTemas = [];

    for (const request of temaRequests) {
      const excludeIds = [...exclude];
      const [disponibles, preguntas] = await Promise.all([
        profesorWorkspaceSeleccionRepository.countDisponibles({
          oposicionId: payload.oposicion_id,
          temaId: request.temaId,
          dificultad: payload.dificultad,
          excludeIds,
          officialidad: payload.officialidad,
          anioIds: payload.anio_ids,
          examenId: payload.examen_id,
          examenIds: getExamenIds(payload),
        }),
        profesorWorkspaceSeleccionRepository.listPreguntasDisponibles({
          oposicionId: payload.oposicion_id,
          temaId: request.temaId,
          cantidad: request.cantidad,
          dificultad: payload.dificultad,
          excludeIds,
          officialidad: payload.officialidad,
          anioIds: payload.anio_ids,
          examenId: payload.examen_id,
          examenIds: getExamenIds(payload),
        }),
      ]);

      preguntas.forEach((pregunta) => exclude.add(Number(pregunta.id)));
      seleccionadas.push(...preguntas);

      const faltantes = Math.max(0, request.cantidad - preguntas.length);
      resumenTemas.push({ tema_id: request.temaId, tema_nombre: nombresTema.get(request.temaId) ?? `Tema ${request.temaId}`, solicitadas: request.cantidad, disponibles, seleccionadas: preguntas.length, faltantes });
      if (faltantes > 0) {
        avisos.push({ tipo: 'preguntas_insuficientes', tema_id: request.temaId, mensaje: `Faltan ${faltantes} preguntas para completar el tema ${nombresTema.get(request.temaId) ?? `Tema ${request.temaId}`}`, faltantes });
      }
    }

    if (payload.permitir_completar_con_otros_temas) {
      await this.completarFaltantes({ payload, temaRequests, resumenTemas, seleccionadas, exclude, avisos });
    }

    const byTema = new Map();
    for (const pregunta of seleccionadas) {
      const key = Number(pregunta.tema_id);
      if (!byTema.has(key)) byTema.set(key, { tema_id: key, tema_nombre: pregunta.tema_nombre, preguntas: [] });
      byTema.get(key).preguntas.push(pregunta);
    }

    return { preguntas: seleccionadas, grupos: [...byTema.values()], resumen_temas: resumenTemas, total_seleccionadas: seleccionadas.length, avisos };
  },
};
