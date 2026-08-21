import { albacerAlumnoRepository } from '../repositories/albacerAlumno.repository.js';
import { adminTestsRepository } from '../repositories/adminTests.repository.js';
import { adminSimulacrosRepository } from '../repositories/adminSimulacros.repository.js';
import { testRepository } from '../repositories/test.repository.js';
import { accessContextService } from './accessContext.service.js';
import { ApiError } from '../utils/api-error.js';

const toNumber = (value) => (value == null ? null : Number(value));
const secondsFromMinutes = (value) => (value ? Number(value) * 60 : null);

const isSuperado = (modulo) => modulo.progreso?.estado === 'superado';

async function assertAccesoGuiado(userId, oposicionId) {
  const contexto = await accessContextService.obtenerContextoUsuario({
    usuarioId: userId,
    oposicionId,
    principal: { tipo: 'alumno', usuarioId: userId },
  });
  if (!contexto.permisos.puede_acceder_contenido || !contexto.permisos.puede_usar_guiado) {
    throw new ApiError(403, 'No tienes acceso activo a esta oposicion');
  }
  return contexto;
}

function addAvailability(modulos) {
  let previousAreCompleted = true;
  return modulos.map((modulo) => {
    let estadoCalculado = 'bloqueado';
    if (isSuperado(modulo)) {
      estadoCalculado = 'superado';
    } else if (previousAreCompleted) {
      estadoCalculado = 'disponible';
      previousAreCompleted = false;
    }

    if (!isSuperado(modulo)) previousAreCompleted = false;

    const moduloDisponible = estadoCalculado !== 'bloqueado';
    const moduloSuperado = estadoCalculado === 'superado';
    let previousMandatoryPassed = true;
    const items = (modulo.items ?? []).map((item) => {
      const progreso = item.progreso ?? {};
      const itemPassed = item.tipo === 'test' && (progreso.superado === true || moduloSuperado);
      let estado = 'locked';

      if (moduloDisponible) {
        if (item.tipo === 'simulacro_final') {
          estado = moduloSuperado ? 'passed' : 'available';
        } else if (itemPassed) {
          estado = 'passed';
        } else if (!item.obligatorio) {
          estado = 'available';
        } else if (moduloSuperado || previousMandatoryPassed) {
          estado = progreso.iniciado_en || Number(progreso.intentos ?? 0) > 0 ? 'in_progress' : 'available';
        }
      }

      if (item.tipo === 'test' && item.obligatorio) {
        previousMandatoryPassed = itemPassed;
      }

      return {
        ...item,
        estado,
        disponible: estado !== 'locked',
        bloqueado: estado === 'locked',
        superado: estado === 'passed',
        intentos: Number(progreso.intentos ?? 0),
        mejor_nota: progreso.mejor_nota ?? null,
        ultima_nota: progreso.ultima_nota ?? null,
        superado_por: itemPassed
          ? (Number(progreso.mejor_nota ?? -Infinity) >= 5 ? 'intento' : 'simulacro_final')
          : null,
      };
    });

    return {
      ...modulo,
      items,
      estado_calculado: estadoCalculado,
      bloqueado: estadoCalculado === 'bloqueado',
      actual: estadoCalculado === 'disponible',
    };
  });
}

function findCurrentModulo(modulos) {
  return modulos.find((modulo) => modulo.estado_calculado === 'disponible')
    ?? modulos.find((modulo) => modulo.estado_calculado === 'superado')
    ?? null;
}

function buildTestScoringSnapshot(plantilla) {
  return {
    source: 'admin_test',
    plantilla_test_id: Number(plantilla.id),
    tipo_puntuacion: plantilla.tipo_puntuacion ?? 'estandar',
    pts_acierto: Number(plantilla.pts_acierto ?? 1),
    pts_fallo: Number(plantilla.pts_fallo ?? -0.25),
    pts_blanco: Number(plantilla.pts_blanco ?? 0),
    mostrar_resultados: Boolean(plantilla.mostrar_resultados),
    mostrar_explicaciones: Boolean(plantilla.mostrar_explicaciones),
  };
}

function buildSimulacroScoringSnapshot(simulacro) {
  return {
    source: 'simulacro',
    simulacro_id: Number(simulacro.id),
    puntuacion_maxima: Number(simulacro.puntuacion_maxima ?? 100),
    penalizacion: Number(simulacro.penalizacion ?? 0),
    criterio_superacion: simulacro.criterio_superacion ?? 'nota',
    valor_superacion: simulacro.valor_superacion == null ? null : Number(simulacro.valor_superacion),
    mostrar_resultados_al_final: Boolean(simulacro.mostrar_resultados_al_final),
  };
}

export const albacerAlumnoService = {
  async getEstado(userId, oposicionId) {
    if (!oposicionId) throw new ApiError(400, 'oposicion_id es requerido');
    const contexto = await assertAccesoGuiado(userId, oposicionId);
    const acceso = await albacerAlumnoRepository.getAcceso(userId, oposicionId);
    if (!acceso) throw new ApiError(403, 'No tienes acceso activo a esta oposicion');

    const modulos = addAvailability(await albacerAlumnoRepository.listModulos(userId, oposicionId));
    const actual = findCurrentModulo(modulos);
    if (actual?.estado_calculado === 'disponible') {
      await albacerAlumnoRepository.upsertModuloDisponible(userId, actual.id);
    }

    return {
      oposicion_id: contexto.oposicion_id,
      tipo_alumno: acceso.tipo_alumno,
      modo_preparacion: acceso.modo_preparacion,
      total_modulos: modulos.length,
      modulos_superados: modulos.filter((modulo) => modulo.estado_calculado === 'superado').length,
      plan_completado: modulos.length > 0 && modulos.every((modulo) => modulo.estado_calculado === 'superado'),
      modulo_actual: actual,
    };
  },

  async listModulos(userId, oposicionId) {
    if (!oposicionId) throw new ApiError(400, 'oposicion_id es requerido');
    await assertAccesoGuiado(userId, oposicionId);
    const acceso = await albacerAlumnoRepository.getAcceso(userId, oposicionId);
    if (!acceso) throw new ApiError(403, 'No tienes acceso activo a esta oposicion');

    const modulos = addAvailability(await albacerAlumnoRepository.listModulos(userId, oposicionId));
    const actual = findCurrentModulo(modulos);
    if (actual?.estado_calculado === 'disponible') {
      await albacerAlumnoRepository.upsertModuloDisponible(userId, actual.id);
    }

    return { items: modulos, total: modulos.length };
  },

  async empezarItem(userId, itemId) {
    const item = await albacerAlumnoRepository.getItemForAlumno(userId, itemId);
    if (!item) throw new ApiError(404, 'Actividad Albacer no encontrada');
    await assertAccesoGuiado(userId, item.oposicion_id);

    const modulo = await this.assertModuloDisponible(userId, item.modulo_id);
    const resolvedItem = modulo.items?.find((candidate) => Number(candidate.id) === Number(itemId));
    if (!resolvedItem?.disponible) {
      throw new ApiError(403, 'Este test esta bloqueado hasta superar el test obligatorio anterior');
    }

    if (item.tipo === 'test') return this.empezarPlantilla(userId, item);
    if (item.tipo === 'simulacro_final') return this.empezarSimulacroFinal(userId, item);
    throw new ApiError(400, 'Tipo de actividad Albacer no soportado');
  },

  async empezarSimulacroFinalByModulo(userId, moduloId) {
    const item = await albacerAlumnoRepository.getFinalItemForAlumno(userId, moduloId);
    if (!item) throw new ApiError(404, 'Este modulo no tiene simulacro final publicado');
    await assertAccesoGuiado(userId, item.oposicion_id);
    await this.assertModuloDisponible(userId, item.modulo_id);
    return this.empezarSimulacroFinal(userId, item);
  },

  async assertModuloDisponible(userId, moduloId) {
    const modulo = await albacerAlumnoRepository.getModuloForAlumno(userId, moduloId);
    if (!modulo) throw new ApiError(404, 'Modulo Albacer no encontrado');
    await assertAccesoGuiado(userId, modulo.oposicion_id);

    const modulos = addAvailability(await albacerAlumnoRepository.listModulos(userId, modulo.oposicion_id));
    const resolved = modulos.find((candidate) => Number(candidate.id) === Number(moduloId));
    if (!resolved || resolved.estado_calculado === 'bloqueado') {
      throw new ApiError(403, 'Este modulo esta bloqueado hasta superar los modulos anteriores');
    }

    await albacerAlumnoRepository.upsertModuloDisponible(userId, moduloId);
    return resolved;
  },

  async empezarPlantilla(userId, item) {
    const plantilla = await adminTestsRepository.getTest(item.plantilla_test_id);
    if (!plantilla) throw new ApiError(404, 'Test Albacer no encontrado');
    if (plantilla.estado !== 'publicado') throw new ApiError(400, 'El test Albacer no esta publicado');
    if (Number(plantilla.oposicion_id) !== Number(item.oposicion_id)) {
      throw new ApiError(400, 'El test Albacer no pertenece a esta oposicion');
    }

    const preguntaIds = (plantilla.preguntas ?? []).map((pregunta) => Number(pregunta.id)).filter(Boolean);
    if (preguntaIds.length === 0) throw new ApiError(400, 'El test Albacer no tiene preguntas');

    const test = await testRepository.createTest({
      userId,
      temaId: toNumber(plantilla.tema_id),
      oposicionId: toNumber(item.oposicion_id),
      tipoTest: 'plantilla_test',
      numeroPreguntas: preguntaIds.length,
      duracionSegundos: secondsFromMinutes(plantilla.duracion_minutos),
      modoPreparacion: 'albacer',
      albacerModuloId: toNumber(item.modulo_id),
      albacerItemId: toNumber(item.id),
      scoringSnapshot: buildTestScoringSnapshot(plantilla),
    });
    await testRepository.insertTestPreguntas(test.id, preguntaIds);
    if (item.obligatorio) {
      await albacerAlumnoRepository.upsertItemIniciado(userId, item.id);
    }
    const data = await testRepository.getTestConfig(userId, test.id);
    return {
      ...data,
      testId: Number(test.id),
      albacerModuloId: toNumber(item.modulo_id),
      albacerItemId: toNumber(item.id),
      origen: 'albacer',
    };
  },

  async empezarSimulacroFinal(userId, item) {
    const simulacro = await adminSimulacrosRepository.getSimulacro(item.simulacro_id);
    if (!simulacro) throw new ApiError(404, 'Simulacro final Albacer no encontrado');
    if (simulacro.estado !== 'publicado') throw new ApiError(400, 'El simulacro final Albacer no esta publicado');
    if (Number(simulacro.oposicion_id) !== Number(item.oposicion_id)) {
      throw new ApiError(400, 'El simulacro final no pertenece a esta oposicion');
    }

    const preguntaIds = (simulacro.bloques ?? [])
      .flatMap((bloque) => bloque.preguntas ?? [])
      .map((pregunta) => Number(pregunta.id))
      .filter(Boolean);
    if (preguntaIds.length === 0) throw new ApiError(400, 'El simulacro final Albacer no tiene preguntas');

    const test = await testRepository.createTest({
      userId,
      oposicionId: toNumber(item.oposicion_id),
      tipoTest: 'simulacro',
      numeroPreguntas: preguntaIds.length,
      duracionSegundos: toNumber(simulacro.tiempo_limite_segundos),
      modoPreparacion: 'albacer',
      albacerModuloId: toNumber(item.modulo_id),
      albacerItemId: toNumber(item.id),
      scoringSnapshot: buildSimulacroScoringSnapshot(simulacro),
    });
    await testRepository.insertTestPreguntas(test.id, preguntaIds);
    const data = await testRepository.getTestConfig(userId, test.id);
    return {
      ...data,
      testId: Number(test.id),
      albacerModuloId: toNumber(item.modulo_id),
      albacerItemId: toNumber(item.id),
      origen: 'albacer',
    };
  },
};
