import { adminSimulacrosRepository } from '../repositories/adminSimulacros.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { profesorWorkspaceSeleccionRepository } from '../repositories/profesorWorkspaceSeleccion.repository.js';
import { ApiError } from '../utils/api-error.js';

const isProfesor = (caller = {}) => caller.role === 'profesor';
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
export const resolveConfiguredExamIds = (config = {}) => {
  const multipleIds = [...new Set((config.examen_ids ?? []).map(String))];
  if (multipleIds.length > 0) return multipleIds;
  return config.examen_id == null ? [] : [String(config.examen_id)];
};

const configExamenIds = resolveConfiguredExamIds;

export const adminSimulacrosService = {
  async getAllowedOposicionIds(caller = {}) {
    if (!isProfesor(caller)) return null;
    const ids = await profesorAccessRepository.listAssignedOposicionIds(caller.userId);
    if (ids.length === 0) throw new ApiError(403, 'No tienes oposiciones asignadas');
    return ids;
  },

  assertOposicionAllowed(oposicionId, allowedIds) {
    if (!allowedIds) return;
    if (!oposicionId || !allowedIds.includes(Number(oposicionId))) {
      throw new ApiError(403, 'No tienes asignada esa oposicion');
    }
  },

  async assertPreguntasAllowed(preguntaIds, oposicionId, allowedIds) {
    const nonApprovedIds = await profesorAccessRepository.getNonApprovedPreguntaIds(preguntaIds);
    if (nonApprovedIds.length > 0) throw new ApiError(400, 'Solo se pueden asignar preguntas aprobadas');
    if (!allowedIds) return;
    this.assertOposicionAllowed(oposicionId, allowedIds);
    const preguntaOposicionIds = await profesorAccessRepository.getPreguntaOposicionIds(preguntaIds);
    if (preguntaOposicionIds.length !== 1 || preguntaOposicionIds[0] !== Number(oposicionId)) {
      throw new ApiError(403, 'Solo puedes asignar preguntas de tus oposiciones asignadas');
    }
  },

  async assertExistingPreguntasMatchOposicion(simulacroId, oposicionId) {
    const preguntaIds = await adminSimulacrosRepository.getSimulacroPreguntaIds(simulacroId);
    if (preguntaIds.length === 0) return;
    const preguntaOposicionIds = await profesorAccessRepository.getPreguntaOposicionIds(preguntaIds);
    if (preguntaOposicionIds.length !== 1 || preguntaOposicionIds[0] !== Number(oposicionId)) {
      throw new ApiError(400, 'No puedes cambiar la oposicion mientras el simulacro contiene preguntas de otra oposicion');
    }
  },

  async assertBloqueBelongsToSimulacro(simulacroId, bloqueId) {
    const belongs = await adminSimulacrosRepository.bloqueBelongsToSimulacro(simulacroId, bloqueId);
    if (!belongs) throw new ApiError(404, 'Bloque no encontrado en este simulacro');
  },

  async listSimulacros({ q, estado, oposicionId, scope, page, pageSize }, caller = {}) {
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    if (allowedOposicionIds && oposicionId) this.assertOposicionAllowed(oposicionId, allowedOposicionIds);
    return adminSimulacrosRepository.listSimulacros({
      q: q ?? null,
      estado: estado ?? null,
      oposicionId: oposicionId ?? null,
      allowedOposicionIds,
      scope: scope ?? null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  },

  async getSimulacro(id, caller = {}) {
    const data = await adminSimulacrosRepository.getSimulacro(id);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    this.assertOposicionAllowed(data.oposicion_id, allowedOposicionIds);
    return data;
  },

  async createSimulacro(fields, caller = {}) {
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    this.assertOposicionAllowed(fields.oposicion_id, allowedOposicionIds);
    const shouldPublishAfterSetup = fields.wizard_simplificado && fields.configuracion_preguntas && fields.estado === 'publicado';
    const data = await adminSimulacrosRepository.createSimulacro(
      shouldPublishAfterSetup ? { ...fields, estado: 'borrador' } : fields,
      caller.userId,
    );
    if (fields.wizard_simplificado && fields.configuracion_preguntas) {
      await this.assertConfigTemas(fields.configuracion_preguntas, fields.oposicion_id);
      await this.assertConfigOfficialFilters(fields.configuracion_preguntas, fields.oposicion_id);
      await adminSimulacrosRepository.createBloque(data.id, {
        nombre: 'Simulacro completo',
        orden: 1,
        numero_preguntas: fields.configuracion_preguntas.total_preguntas,
      });
      await adminSimulacrosRepository.saveConfiguracionPreguntas(data.id, {
        ...fields.configuracion_preguntas,
        temas: fields.configuracion_preguntas.reparto_por_tema ? fields.configuracion_preguntas.reparto : fields.configuracion_preguntas.tema_ids.map((tema_id) => ({ tema_id, cantidad: null })),
      });
      if (shouldPublishAfterSetup) {
        await this.assertConfiguracionPublicable(data.id);
        await adminSimulacrosRepository.updateSimulacro(data.id, { estado: 'publicado' });
      }
      return this.getSimulacro(data.id, caller);
    }
    return data;
  },

  async assertConfigTemas(config, oposicionId) {
    const valid = await profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion(oposicionId, config.tema_ids);
    if (valid.length !== config.tema_ids.length) {
      throw new ApiError(400, 'Todos los temas deben pertenecer a la oposicion indicada');
    }
  },

  async assertConfigOfficialFilters(config, oposicionId) {
    if (config.officialidad !== 'official') return;
    const anioIds = (config.anio_ids ?? []).map(String);
    const examenIds = resolveConfiguredExamIds(config);
    const scope = await adminSimulacrosRepository.getOfficialFilterScope(oposicionId, anioIds, examenIds);
    if (scope.years.length !== anioIds.length) {
      throw new ApiError(400, 'Todos los años oficiales deben pertenecer a la oposicion indicada');
    }
    if (scope.exams.length !== examenIds.length) {
      throw new ApiError(400, 'Todos los exámenes oficiales deben pertenecer a la oposicion indicada');
    }
    if (anioIds.length > 0 && scope.exams.some((exam) => !anioIds.includes(String(exam.oposicion_anio_id)))) {
      throw new ApiError(400, 'Los exámenes oficiales deben pertenecer a los años seleccionados');
    }
  },

  async assertPreguntasWithinConfiguration(simulacro, bloqueId, preguntaIds) {
    const config = simulacro?.configuracion_preguntas;
    if (!config) return;

    const ids = [...new Set((preguntaIds ?? []).map((id) => String(id)))];
    const rows = await adminSimulacrosRepository.getPreguntasForAssignmentValidation(simulacro.id, ids);
    const found = new Set(rows.map((row) => String(row.id)));
    if (found.size !== ids.length) throw new ApiError(400, 'Una o mas preguntas no existen');

    for (const row of rows) {
      if (row.estado !== 'aprobada') throw new ApiError(400, 'Solo se pueden asignar preguntas aprobadas');
      if (Number(row.oposicion_id) !== Number(simulacro.oposicion_id)) throw new ApiError(400, 'La pregunta no pertenece a la oposicion del simulacro');
      if (!row.tema_configurado) throw new ApiError(400, 'La pregunta no pertenece a los temas configurados del simulacro');
      if (config.dificultad && row.nivel_dificultad !== config.dificultad) throw new ApiError(400, 'La pregunta no cumple la dificultad configurada');
      if (config.officialidad === 'official' && (!row.es_oficial || (config.anio_ids?.length && !row.coincide_anio) || (configExamenIds(config).length && !row.coincide_examen))) {
        throw new ApiError(400, 'La pregunta no cumple la oficialidad configurada');
      }
      if (config.officialidad === 'non_official' && row.es_oficial) throw new ApiError(400, 'La pregunta no cumple la oficialidad configurada');
    }

    if (config.reparto_por_tema) {
      const currentIds = await adminSimulacrosRepository.getBloquePreguntaIds(bloqueId);
      const finalIds = [...new Set([...currentIds.map(String), ...ids])];
      const topicRows = await adminSimulacrosRepository.getPreguntaTopicIds(finalIds);
      const counts = new Map();
      for (const row of topicRows) counts.set(Number(row.tema_id), (counts.get(Number(row.tema_id)) ?? 0) + 1);
      for (const item of config.temas ?? []) {
        if (item.cantidad != null && (counts.get(Number(item.tema_id)) ?? 0) > Number(item.cantidad)) {
          throw new ApiError(400, 'La asignacion supera el reparto configurado para un tema');
        }
      }
    }
  },

  async assertConfiguracionPublicable(simulacroId) {
    const simulacro = await adminSimulacrosRepository.getSimulacro(simulacroId);
    const config = simulacro?.configuracion_preguntas;
    if (!config) return;
    if (simulacro.bloques?.length !== 1) throw new ApiError(400, 'El simulacro simplificado debe tener un unico bloque');
    const rows = await adminSimulacrosRepository.getConfiguracionPreguntasValidation(simulacroId);
    if (rows.length !== Number(config.total_preguntas)) throw new ApiError(400, 'El simulacro debe contener exactamente el total de preguntas configurado');
    const temas = new Set((config.temas ?? []).map((item) => String(item.tema_id)));
    const counts = new Map();
    for (const row of rows) {
      if (row.estado !== 'aprobada' || Number(row.oposicion_id) !== Number(simulacro.oposicion_id)) throw new ApiError(400, 'Todas las preguntas deben estar aprobadas y pertenecer a la oposicion');
      if (config.dificultad && row.nivel_dificultad !== config.dificultad) throw new ApiError(400, 'Las preguntas no cumplen la dificultad configurada');
      if (!temas.has(String(row.tema_id))) throw new ApiError(400, 'Las preguntas no pertenecen a los temas configurados');
      if (config.officialidad === 'official' && (!row.es_oficial || (config.anio_ids?.length && !row.coincide_anio) || (configExamenIds(config).length && !row.coincide_examen))) throw new ApiError(400, 'Las preguntas no cumplen la oficialidad configurada');
      if (config.officialidad === 'non_official' && row.es_oficial) throw new ApiError(400, 'Las preguntas no cumplen la oficialidad configurada');
      counts.set(String(row.tema_id), (counts.get(String(row.tema_id)) ?? 0) + 1);
    }
    if (config.reparto_por_tema) {
      for (const item of config.temas ?? []) if (counts.get(String(item.tema_id)) !== Number(item.cantidad)) throw new ApiError(400, 'Las preguntas no cumplen el reparto por tema configurado');
    }
  },

  async updateSimulacro(id, fields, caller = {}) {
    const current = await this.getSimulacro(id, caller);
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    const oposicionId = hasOwn(fields, 'oposicion_id') ? fields.oposicion_id : current.oposicion_id;
    this.assertOposicionAllowed(oposicionId, allowedOposicionIds);
    await this.assertExistingPreguntasMatchOposicion(id, oposicionId);
    if (fields.estado === 'publicado') await this.assertConfiguracionPublicable(id);
    const data = await adminSimulacrosRepository.updateSimulacro(id, fields);
    if (!data && !fields.configuracion_preguntas) throw new ApiError(404, 'Simulacro no encontrado');
    if (fields.configuracion_preguntas) {
      await this.assertConfigTemas(fields.configuracion_preguntas, oposicionId);
      await this.assertConfigOfficialFilters(fields.configuracion_preguntas, oposicionId);
      await adminSimulacrosRepository.saveConfiguracionPreguntas(id, {
        ...fields.configuracion_preguntas,
        temas: fields.configuracion_preguntas.reparto_por_tema ? fields.configuracion_preguntas.reparto : fields.configuracion_preguntas.tema_ids.map((tema_id) => ({ tema_id, cantidad: null })),
      });
    }
    return fields.configuracion_preguntas ? this.getSimulacro(id, caller) : data;
  },

  async deleteSimulacro(id) {
    const data = await adminSimulacrosRepository.deleteSimulacro(id);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    return data;
  },

  async createBloque(simulacroId, fields, caller = {}) {
    await this.getSimulacro(simulacroId, caller);
    return adminSimulacrosRepository.createBloque(simulacroId, fields);
  },

  async updateBloque(simulacroId, bloqueId, fields, caller = {}) {
    await this.getSimulacro(simulacroId, caller);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const data = await adminSimulacrosRepository.updateBloque(bloqueId, fields);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },

  async deleteBloque(simulacroId, bloqueId, caller = {}) {
    await this.getSimulacro(simulacroId, caller);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const data = await adminSimulacrosRepository.deleteBloque(bloqueId);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },

  async asignarPreguntas(simulacroId, bloqueId, preguntaIds, caller = {}) {
    const simulacro = await this.getSimulacro(simulacroId, caller);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    await this.assertPreguntasAllowed(preguntaIds, simulacro.oposicion_id, allowedOposicionIds);
    await this.assertPreguntasWithinConfiguration(simulacro, bloqueId, preguntaIds);
    return adminSimulacrosRepository.asignarPreguntas(bloqueId, preguntaIds);
  },

  async quitarPregunta(simulacroId, bloqueId, preguntaId, caller = {}) {
    await this.getSimulacro(simulacroId, caller);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const data = await adminSimulacrosRepository.quitarPregunta(bloqueId, preguntaId);
    if (!data) throw new ApiError(404, 'Asignacion no encontrada');
    return data;
  },
};
