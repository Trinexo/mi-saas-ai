import { profesorWorkspaceSeleccionRepository } from '../repositories/profesorWorkspaceSeleccion.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { ApiError } from '../utils/api-error.js';

const uniqNumbers = (items = []) => [...new Set(items.map(Number).filter(Boolean))];

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

export const profesorWorkspaceSeleccionService = {
  async seleccionar(userId, payload) {
    const hasOposicion = await profesorAccessRepository.hasAssignedOposicion(userId, payload.oposicion_id);
    if (!hasOposicion) throw new ApiError(403, 'No tienes asignada esa oposicion');

    if (payload.plantilla_test_id) {
      const allowed = await profesorAccessRepository.hasAssignedPlantillaTest(userId, payload.plantilla_test_id);
      if (!allowed) throw new ApiError(403, 'No tienes acceso a esa plantilla de test');
    }

    if (payload.simulacro_id) {
      const allowed = await profesorAccessRepository.hasAssignedSimulacro(userId, payload.simulacro_id);
      if (!allowed) throw new ApiError(403, 'No tienes acceso a ese simulacro');
    }

    const temaRequests = buildTemaRequests(payload);
    const temaIds = uniqNumbers(temaRequests.map((item) => item.temaId));
    const validTemaIds = await profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion(payload.oposicion_id, temaIds);
    if (validTemaIds.length !== temaIds.length) {
      throw new ApiError(400, 'Todos los temas deben pertenecer a la oposicion indicada');
    }

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
        }),
        profesorWorkspaceSeleccionRepository.listPreguntasDisponibles({
          oposicionId: payload.oposicion_id,
          temaId: request.temaId,
          cantidad: request.cantidad,
          dificultad: payload.dificultad,
          excludeIds,
        }),
      ]);

      preguntas.forEach((pregunta) => exclude.add(Number(pregunta.id)));
      seleccionadas.push(...preguntas);

      const faltantes = Math.max(0, request.cantidad - preguntas.length);
      resumenTemas.push({
        tema_id: request.temaId,
        solicitadas: request.cantidad,
        disponibles,
        seleccionadas: preguntas.length,
        faltantes,
      });
      if (faltantes > 0) {
        avisos.push({
          tipo: 'preguntas_insuficientes',
          tema_id: request.temaId,
          mensaje: `Faltan ${faltantes} preguntas para completar el tema ${request.temaId}`,
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
    const temaRequests = buildTemaRequests(payload);
    const temaIds = uniqNumbers(temaRequests.map((item) => item.temaId));
    const validTemaIds = await profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion(payload.oposicion_id, temaIds);
    if (validTemaIds.length !== temaIds.length) {
      throw new ApiError(400, 'Todos los temas deben pertenecer a la oposicion indicada');
    }

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
        }),
        profesorWorkspaceSeleccionRepository.listPreguntasDisponibles({
          oposicionId: payload.oposicion_id,
          temaId: request.temaId,
          cantidad: request.cantidad,
          dificultad: payload.dificultad,
          excludeIds,
        }),
      ]);

      preguntas.forEach((pregunta) => exclude.add(Number(pregunta.id)));
      seleccionadas.push(...preguntas);

      const faltantes = Math.max(0, request.cantidad - preguntas.length);
      resumenTemas.push({ tema_id: request.temaId, solicitadas: request.cantidad, disponibles, seleccionadas: preguntas.length, faltantes });
      if (faltantes > 0) {
        avisos.push({ tipo: 'preguntas_insuficientes', tema_id: request.temaId, mensaje: `Faltan ${faltantes} preguntas para el tema ${request.temaId}`, faltantes });
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
