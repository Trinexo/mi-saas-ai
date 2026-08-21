import { profesorSimulacrosRepository } from '../repositories/profesorSimulacros.repository.js';
import { adminSimulacrosRepository } from '../repositories/adminSimulacros.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { profesorWorkspaceSeleccionRepository } from '../repositories/profesorWorkspaceSeleccion.repository.js';
import { ApiError } from '../utils/api-error.js';
import { adminSimulacrosService } from './adminSimulacros.service.js';

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export const profesorSimulacrosService = {
  async assertOposicionAsignada(userId, oposicionId) {
    if (!oposicionId) throw new ApiError(400, 'Debes seleccionar una oposicion asignada');
    const asignada = await profesorAccessRepository.hasAssignedOposicion(userId, oposicionId);
    if (!asignada) throw new ApiError(403, 'No tienes asignada esa oposicion');
  },

  async assertPreguntasDeOposicion(preguntaIds, oposicionId) {
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

  async getMisTests(userId, { oposicionId, q, scope, page, pageSize }) {
    if (oposicionId) await this.assertOposicionAsignada(userId, oposicionId);
    return profesorSimulacrosRepository.getMisTests(userId, {
      oposicionId: oposicionId ?? null,
      q: q ?? null,
      scope: scope ?? null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  },

  async getMisSimulacros(userId, { oposicionId, estado, q, scope, page, pageSize }) {
    if (oposicionId) await this.assertOposicionAsignada(userId, oposicionId);
    return profesorSimulacrosRepository.getMisSimulacros(userId, {
      oposicionId: oposicionId ?? null,
      estado: estado ?? null,
      q: q ?? null,
      scope: scope ?? null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  },

  async getSimulacro(userId, simulacroId) {
    const data = await adminSimulacrosRepository.getSimulacro(simulacroId);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    await this.assertOposicionAsignada(userId, data.oposicion_id);
    const creator = await profesorSimulacrosRepository.getSimulacroCreatorInfo(simulacroId);
    const { creado_por: _creatorId, ...publicData } = data;
    return {
      ...publicData,
      es_propietario: String(data.creado_por) === String(userId),
      origen: creator?.creador_role === 'admin' ? 'admin' : 'profesor',
    };
  },

  async getSimulacroEditable(userId, simulacroId) {
    const data = await this.getSimulacro(userId, simulacroId);
    if (!data.es_propietario) throw new ApiError(403, 'Solo puedes modificar simulacros creados por ti');
    return data;
  },

  async createSimulacro(userId, fields) {
    await this.assertOposicionAsignada(userId, fields.oposicion_id);
    const shouldPublishAfterSetup = fields.wizard_simplificado && fields.configuracion_preguntas && fields.estado === 'publicado';
    const data = await adminSimulacrosRepository.createSimulacro(
      shouldPublishAfterSetup ? { ...fields, estado: 'borrador' } : fields,
      userId,
    );
    if (fields.wizard_simplificado && fields.configuracion_preguntas) {
      await this.assertConfigTemas(fields.configuracion_preguntas, fields.oposicion_id);
      await adminSimulacrosService.assertConfigOfficialFilters(fields.configuracion_preguntas, fields.oposicion_id);
      await adminSimulacrosRepository.createBloque(data.id, {
        nombre: 'Simulacro completo', orden: 1,
        numero_preguntas: fields.configuracion_preguntas.total_preguntas,
      });
      await adminSimulacrosRepository.saveConfiguracionPreguntas(data.id, {
        ...fields.configuracion_preguntas,
        temas: fields.configuracion_preguntas.reparto_por_tema
          ? fields.configuracion_preguntas.reparto
          : fields.configuracion_preguntas.tema_ids.map((tema_id) => ({ tema_id, cantidad: null })),
      });
      if (shouldPublishAfterSetup) {
        await adminSimulacrosService.assertConfiguracionPublicable(data.id);
        await adminSimulacrosRepository.updateSimulacro(data.id, { estado: 'publicado' });
      }
      return this.getSimulacro(userId, data.id);
    }
    return data;
  },

  async assertConfigTemas(config, oposicionId) {
    const valid = await profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion(oposicionId, config.tema_ids);
    if (valid.length !== config.tema_ids.length) throw new ApiError(400, 'Todos los temas deben pertenecer a la oposicion indicada');
  },

  async updateSimulacro(userId, simulacroId, fields) {
    const current = await this.getSimulacroEditable(userId, simulacroId);
    const oposicionId = hasOwn(fields, 'oposicion_id') ? fields.oposicion_id : current.oposicion_id;
    await this.assertOposicionAsignada(userId, oposicionId);
    await this.assertExistingPreguntasMatchOposicion(simulacroId, oposicionId);
    if (fields.estado === 'publicado') {
      const config = (await adminSimulacrosRepository.getSimulacro(simulacroId))?.configuracion_preguntas;
      if (config) await adminSimulacrosService.assertConfiguracionPublicable(simulacroId);
    }
    const data = await adminSimulacrosRepository.updateSimulacro(simulacroId, fields);
    if (!data && !fields.configuracion_preguntas) throw new ApiError(404, 'Simulacro no encontrado');
    if (fields.configuracion_preguntas) {
      await this.assertConfigTemas(fields.configuracion_preguntas, oposicionId);
      await adminSimulacrosService.assertConfigOfficialFilters(fields.configuracion_preguntas, oposicionId);
      await adminSimulacrosRepository.saveConfiguracionPreguntas(simulacroId, {
        ...fields.configuracion_preguntas,
        temas: fields.configuracion_preguntas.reparto_por_tema
          ? fields.configuracion_preguntas.reparto
          : fields.configuracion_preguntas.tema_ids.map((tema_id) => ({ tema_id, cantidad: null })),
      });
    }
    return fields.configuracion_preguntas ? this.getSimulacro(userId, simulacroId) : data;
  },

  async deleteSimulacro(userId, simulacroId) {
    const current = await this.getSimulacroEditable(userId, simulacroId);
    const data = await adminSimulacrosRepository.deleteSimulacro(current.id);
    if (!data) throw new ApiError(404, 'Simulacro no encontrado');
    return data;
  },

  async createBloque(userId, simulacroId, fields) {
    await this.getSimulacroEditable(userId, simulacroId);
    return adminSimulacrosRepository.createBloque(simulacroId, {
      nombre: fields.nombre,
      orden: fields.orden ?? 0,
      numero_preguntas: fields.numero_preguntas ?? 0,
    });
  },

  async updateBloque(userId, simulacroId, bloqueId, fields) {
    await this.getSimulacroEditable(userId, simulacroId);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const data = await adminSimulacrosRepository.updateBloque(bloqueId, fields);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },

  async deleteBloque(userId, simulacroId, bloqueId) {
    await this.getSimulacroEditable(userId, simulacroId);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const data = await adminSimulacrosRepository.deleteBloque(bloqueId);
    if (!data) throw new ApiError(404, 'Bloque no encontrado');
    return data;
  },

  async asignarPreguntas(userId, simulacroId, bloqueId, preguntaIds) {
    const simulacro = await this.getSimulacroEditable(userId, simulacroId);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    await this.assertPreguntasDeOposicion(preguntaIds, simulacro.oposicion_id);
    await adminSimulacrosService.assertPreguntasWithinConfiguration(simulacro, bloqueId, preguntaIds);
    return adminSimulacrosRepository.asignarPreguntas(bloqueId, preguntaIds);
  },

  async quitarPregunta(userId, simulacroId, bloqueId, preguntaId) {
    await this.getSimulacroEditable(userId, simulacroId);
    await this.assertBloqueBelongsToSimulacro(simulacroId, bloqueId);
    const data = await adminSimulacrosRepository.quitarPregunta(bloqueId, preguntaId);
    if (!data) throw new ApiError(404, 'Asignacion no encontrada');
    return data;
  },
};
