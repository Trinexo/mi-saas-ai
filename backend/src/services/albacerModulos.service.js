import { albacerModulosRepository } from '../repositories/albacerModulos.repository.js';
import { profesorAccessRepository } from '../repositories/profesorAccess.repository.js';
import { adminTestsService } from './adminTests.service.js';
import { adminSimulacrosService } from './adminSimulacros.service.js';
import { ApiError } from '../utils/api-error.js';

const isProfesor = (caller = {}) => caller.role === 'profesor';
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const uniqTemaIds = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item > 0),
  )];
};

const takeSlice = (items, start, length) => items.slice(start, start + length);

export const albacerModulosService = {
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

  async assertTemasMatchOposicion(oposicionId, temaIds) {
    if (!temaIds.length) return;
    const total = await albacerModulosRepository.countTemasInOposicion(oposicionId, temaIds);
    if (total !== temaIds.length) {
      throw new ApiError(400, 'Todos los temas del modulo deben pertenecer a la oposicion seleccionada');
    }
  },

  async list({ q, estado, oposicionId, page, pageSize }, caller = {}) {
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    if (allowedOposicionIds && oposicionId) this.assertOposicionAllowed(oposicionId, allowedOposicionIds);
    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    return albacerModulosRepository.list({
      q,
      estado,
      oposicionId,
      allowedOposicionIds,
      limit,
      offset,
    });
  },

  async get(id, caller = {}) {
    const modulo = await albacerModulosRepository.get(id);
    if (!modulo) throw new ApiError(404, 'Modulo Albacer no encontrado');
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    this.assertOposicionAllowed(modulo.oposicion_id, allowedOposicionIds);
    return modulo;
  },

  async create(payload, caller = {}) {
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    this.assertOposicionAllowed(payload.oposicion_id, allowedOposicionIds);
    const temaIds = uniqTemaIds(payload.tema_ids);
    await this.assertTemasMatchOposicion(payload.oposicion_id, temaIds);
    const modulo = await albacerModulosRepository.create(payload, caller);
    await albacerModulosRepository.replaceTemas(modulo.id, temaIds);
    return this.get(modulo.id, caller);
  },

  async update(id, payload, caller = {}) {
    const current = await this.get(id, caller);
    const allowedOposicionIds = await this.getAllowedOposicionIds(caller);
    const oposicionId = hasOwn(payload, 'oposicion_id')
      ? payload.oposicion_id
      : current.oposicion_id;
    this.assertOposicionAllowed(oposicionId, allowedOposicionIds);
    const temaIds = hasOwn(payload, 'tema_ids')
      ? uniqTemaIds(payload.tema_ids)
      : current.tema_ids;
    await this.assertTemasMatchOposicion(oposicionId, temaIds);

    const updated = await albacerModulosRepository.update(id, payload);
    if (!updated) throw new ApiError(500, 'No se pudo actualizar el modulo Albacer');
    if (hasOwn(payload, 'tema_ids')) {
      await albacerModulosRepository.replaceTemas(id, temaIds);
    }
    return this.get(id, caller);
  },

  async delete(id, caller = {}) {
    await this.get(id, caller);
    const deleted = await albacerModulosRepository.delete(id);
    if (!deleted) throw new ApiError(404, 'Modulo Albacer no encontrado');
  },

  assertSameOposicion(contentOposicionId, moduloOposicionId) {
    if (Number(contentOposicionId) !== Number(moduloOposicionId)) {
      throw new ApiError(400, 'El contenido debe pertenecer a la misma oposicion que el modulo');
    }
  },

  async listItems(moduloId, caller = {}) {
    await this.get(moduloId, caller);
    return albacerModulosRepository.listItems(moduloId);
  },

  async createItem(moduloId, payload, caller = {}) {
    const modulo = await this.get(moduloId, caller);

    if (payload.tipo === 'test') {
      const test = await adminTestsService.getTest(payload.plantilla_test_id, caller);
      this.assertSameOposicion(test.oposicion_id ?? test.resolved_oposicion_id, modulo.oposicion_id);
      const orden = payload.orden ?? await albacerModulosRepository.getNextItemOrden(moduloId);
      const item = await albacerModulosRepository.createItem(moduloId, {
        ...payload,
        simulacro_id: null,
        orden,
        obligatorio: payload.obligatorio ?? false,
      });
      await albacerModulosRepository.markTestAsModulo(payload.plantilla_test_id, moduloId);
      return this.getItem(item.id, caller);
    }

    const hasFinal = await albacerModulosRepository.hasSimulacroFinal(moduloId);
    if (hasFinal) throw new ApiError(400, 'El modulo ya tiene un simulacro final');
    const simulacro = await adminSimulacrosService.getSimulacro(payload.simulacro_id, caller);
    this.assertSameOposicion(simulacro.oposicion_id, modulo.oposicion_id);
    const orden = payload.orden ?? await albacerModulosRepository.getNextItemOrden(moduloId);
    const item = await albacerModulosRepository.createItem(moduloId, {
      ...payload,
      plantilla_test_id: null,
      orden,
      obligatorio: true,
    });
    await albacerModulosRepository.markSimulacroAsModuloFinal(payload.simulacro_id, moduloId);
    return this.getItem(item.id, caller);
  },

  async getItem(itemId, caller = {}) {
    const item = await albacerModulosRepository.getItem(itemId);
    if (!item) throw new ApiError(404, 'Item del modulo no encontrado');
    await this.get(item.modulo_id, caller);
    const items = await albacerModulosRepository.listItems(item.modulo_id);
    return items.find((candidate) => candidate.id === Number(itemId)) ?? item;
  },

  async updateItem(moduloId, itemId, payload, caller = {}) {
    await this.get(moduloId, caller);
    const item = await albacerModulosRepository.getItem(itemId);
    if (!item || Number(item.modulo_id) !== Number(moduloId)) {
      throw new ApiError(404, 'Item del modulo no encontrado');
    }
    const updated = await albacerModulosRepository.updateItem(itemId, payload);
    if (!updated) throw new ApiError(500, 'No se pudo actualizar el item del modulo');
    return this.getItem(itemId, caller);
  },

  async deleteItem(moduloId, itemId, caller = {}) {
    await this.get(moduloId, caller);
    const item = await albacerModulosRepository.getItem(itemId);
    if (!item || Number(item.modulo_id) !== Number(moduloId)) {
      throw new ApiError(404, 'Item del modulo no encontrado');
    }
    const deleted = await albacerModulosRepository.deleteItem(itemId);
    if (!deleted) throw new ApiError(404, 'Item del modulo no encontrado');
    if (deleted.plantilla_test_id) {
      await albacerModulosRepository.unmarkTestAsModulo(deleted.plantilla_test_id, moduloId);
    }
    if (deleted.simulacro_id) {
      await albacerModulosRepository.unmarkSimulacroAsModuloFinal(deleted.simulacro_id, moduloId);
    }
  },

  async createTestForModulo(moduloId, payload, caller = {}) {
    const modulo = await this.get(moduloId, caller);
    const nombre = payload.nombre?.trim() || `${modulo.nombre} - Test`;
    const test = await adminTestsService.createTest({
      nombre,
      descripcion: payload.descripcion ?? null,
      oposicion_id: modulo.oposicion_id,
      tema_ids: modulo.tema_ids ?? [],
      estado: payload.estado ?? 'borrador',
      nivel_dificultad: payload.nivel_dificultad ?? null,
      duracion_minutos: payload.duracion_minutos ?? null,
      mezclar_preguntas: payload.mezclar_preguntas ?? true,
      mostrar_resultados: payload.mostrar_resultados ?? true,
      mostrar_explicaciones: payload.mostrar_explicaciones ?? false,
      tipo_puntuacion: payload.tipo_puntuacion ?? 'estandar',
      pts_acierto: payload.pts_acierto ?? 1,
      pts_fallo: payload.pts_fallo ?? -0.25,
      pts_blanco: payload.pts_blanco ?? 0,
    }, caller);
    const item = await this.createItem(moduloId, {
      tipo: 'test',
      titulo: test.nombre,
      descripcion: test.descripcion ?? null,
      plantilla_test_id: test.id,
      orden: payload.orden,
      obligatorio: false,
    }, caller);
    return { test, item };
  },

  async generateAutoContent(moduloId, payload, caller = {}) {
    const modulo = await this.get(moduloId, caller);
    const temaIds = modulo.tema_ids ?? [];
    if (!temaIds.length) {
      throw new ApiError(400, 'El modulo necesita al menos un tema para generar contenido automatico');
    }

    const numeroTests = Number(payload.numero_tests ?? 2);
    const preguntasPorTest = Number(payload.preguntas_por_test ?? 20);
    const preguntasSimulacro = Number(payload.preguntas_simulacro_final ?? 50);
    const totalNecesarias = numeroTests * preguntasPorTest + preguntasSimulacro;
    if (await albacerModulosRepository.hasSimulacroFinal(moduloId)) {
      throw new ApiError(400, 'El modulo ya tiene un simulacro final');
    }
    const usedIds = payload.permitir_repetidas
      ? []
      : await albacerModulosRepository.getUsedPreguntaIds(moduloId, null);
    const candidateLimit = payload.permitir_repetidas
      ? Math.max(preguntasPorTest, preguntasSimulacro)
      : totalNecesarias;
    const preguntaIds = await albacerModulosRepository.listPreguntaIdsForAutoModulo({
      oposicionId: modulo.oposicion_id,
      temaIds,
      excludeIds: usedIds,
      nivelDificultad: payload.nivel_dificultad ?? null,
      limit: candidateLimit,
    });

    if (!payload.permitir_repetidas && preguntaIds.length < totalNecesarias) {
      throw new ApiError(400, `No hay preguntas suficientes sin repetir. Necesitas ${totalNecesarias} y hay ${preguntaIds.length} disponibles.`);
    }
    if (payload.permitir_repetidas && preguntaIds.length < Math.max(preguntasPorTest, preguntasSimulacro)) {
      throw new ApiError(400, 'No hay preguntas suficientes para crear al menos un test y el simulacro final');
    }

    const tests = [];
    for (let i = 0; i < numeroTests; i += 1) {
      const preguntasTest = payload.permitir_repetidas
        ? preguntaIds.slice(0, preguntasPorTest)
        : takeSlice(preguntaIds, i * preguntasPorTest, preguntasPorTest);
      const { test, item } = await this.createTestForModulo(moduloId, {
        nombre: `${modulo.nombre} - Test ${i + 1}`,
        descripcion: `Test automatico ${i + 1} del modulo ${modulo.nombre}`,
        estado: payload.estado,
        nivel_dificultad: payload.nivel_dificultad ?? null,
        duracion_minutos: payload.duracion_minutos_test ?? null,
        mostrar_explicaciones: false,
        pts_acierto: payload.pts_acierto,
        pts_fallo: payload.pts_fallo,
        pts_blanco: payload.pts_blanco,
      }, caller);
      await adminTestsService.addPreguntas(test.id, preguntasTest, caller);
      tests.push({ testId: Number(test.id), itemId: Number(item.id), preguntas: preguntasTest.length });
    }

    const simulacroPreguntas = payload.permitir_repetidas
      ? preguntaIds.slice(0, preguntasSimulacro)
      : takeSlice(preguntaIds, numeroTests * preguntasPorTest, preguntasSimulacro);
    const simulacro = await adminSimulacrosService.createSimulacro({
      nombre: `${modulo.nombre} - Simulacro final`,
      descripcion: `Simulacro final automatico del modulo ${modulo.nombre}`,
      oposicion_id: modulo.oposicion_id,
      estado: payload.estado,
      tiempo_limite_segundos: payload.duracion_minutos_simulacro ? payload.duracion_minutos_simulacro * 60 : null,
      penalizacion: Math.abs(Number(payload.pts_fallo ?? -0.25)),
      puntuacion_maxima: preguntasSimulacro,
      mostrar_resultados_al_final: true,
    }, caller);
    const bloque = await adminSimulacrosService.createBloque(simulacro.id, {
      nombre: modulo.nombre,
      orden: 1,
      numero_preguntas: preguntasSimulacro,
    }, caller);
    await adminSimulacrosService.asignarPreguntas(simulacro.id, bloque.id, simulacroPreguntas, caller);
    const simulacroItem = await this.createItem(moduloId, {
      tipo: 'simulacro_final',
      titulo: simulacro.nombre,
      descripcion: simulacro.descripcion ?? null,
      simulacro_id: simulacro.id,
      obligatorio: true,
    }, caller);

    return {
      moduloId: Number(modulo.id),
      tests,
      simulacroFinal: {
        simulacroId: Number(simulacro.id),
        itemId: Number(simulacroItem.id),
        preguntas: simulacroPreguntas.length,
      },
      totalPreguntasUsadas: tests.reduce((acc, test) => acc + test.preguntas, 0) + simulacroPreguntas.length,
    };
  },

  async getUsedQuestionIds(moduloId, { exceptTestId } = {}, caller = {}) {
    await this.get(moduloId, caller);
    const preguntaIds = await albacerModulosRepository.getUsedPreguntaIds(moduloId, exceptTestId ?? null);
    return { pregunta_ids: preguntaIds };
  },
};
