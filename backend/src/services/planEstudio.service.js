import { profesorWorkspacePlanificacionRepository } from '../repositories/profesorWorkspacePlanificacion.repository.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { adminTestsRepository } from '../repositories/adminTests.repository.js';
import { adminSimulacrosRepository } from '../repositories/adminSimulacros.repository.js';
import { testRepository } from '../repositories/test.repository.js';
import { testService } from './test.service.js';
import { ApiError } from '../utils/api-error.js';

const toNumber = (value) => (value == null ? null : Number(value));
const secondsFromMinutes = (value) => (value ? Number(value) * 60 : null);

const assertLegacyPlanAllowed = async (userId, oposicionId) => {
  const acceso = await accesoOposicionRepository.getPreparacion(userId, oposicionId);
  if (!acceso) throw new ApiError(403, 'No tienes acceso a esa oposicion');
  if (acceso.modo_preparacion === 'albacer') {
    throw new ApiError(
      410,
      'El Plan de estudio legacy esta desactivado en Modo Albacer. Usa los modulos Albacer.',
      { code: 'LEGACY_PLAN_DISABLED_IN_ALBACER', oposicionId: Number(oposicionId) },
    );
  }
  return acceso;
};

function buildEqualTemasMix(temaIds) {
  if (temaIds.length < 2) return null;
  const base = Math.floor(100 / temaIds.length);
  let used = 0;
  return temaIds.map((temaId, index) => {
    const pct = index === temaIds.length - 1 ? 100 - used : base;
    used += pct;
    return { temaId, pct };
  });
}

function getPlanTemaIds(item) {
  return (item.temas ?? [])
    .map((tema) => Number(tema.id))
    .filter(Boolean);
}

export const planEstudioService = {
  async list(userId, { oposicion_id: oposicionId }) {
    await assertLegacyPlanAllowed(userId, oposicionId);

    const items = await profesorWorkspacePlanificacionRepository.listForAlumno({
      userId,
      oposicionId,
    });

    return { items };
  },

  async empezar(userId, planificacionId) {
    const item = await profesorWorkspacePlanificacionRepository.getForAlumno(planificacionId, userId);
    if (!item) throw new ApiError(404, 'Actividad no encontrada en tu Plan de estudio');
    await assertLegacyPlanAllowed(userId, Number(item.oposicion_id));
    if (item.estado_alumno !== 'disponible') {
      throw new ApiError(400, 'Esta actividad no esta disponible ahora mismo');
    }

    const intentosUsados = Number(item.intentos_usados ?? 0);
    const intentosMaximos = item.intentos_maximos ? Number(item.intentos_maximos) : null;
    if (!item.permitir_reintento && intentosUsados > 0) {
      throw new ApiError(400, 'Esta actividad no permite reintentos');
    }
    if (intentosMaximos && intentosUsados >= intentosMaximos) {
      throw new ApiError(400, 'Has agotado los intentos disponibles para esta actividad');
    }

    if (item.tipo === 'tema_recomendado') {
      return this.empezarTemaRecomendado(userId, item);
    }
    if (item.tipo === 'plantilla_test') {
      return this.empezarPlantillaTest(userId, item);
    }
    if (item.tipo === 'simulacro') {
      return this.empezarSimulacro(userId, item);
    }
    throw new ApiError(400, 'Tipo de actividad no soportado');
  },

  async empezarTemaRecomendado(userId, item) {
    const temaIds = getPlanTemaIds(item);
    const modoOriginal = item.modo_test || 'normal';
    const modo = temaIds.length > 1 && !['normal', 'adaptativo'].includes(modoOriginal)
      ? 'normal'
      : modoOriginal;
    const data = await testService.generate({
      userId,
      temaId: temaIds.length === 1 ? temaIds[0] : undefined,
      temasMix: buildEqualTemasMix(temaIds) ?? undefined,
      oposicionId: Number(item.oposicion_id),
      numeroPreguntas: Number(item.numero_preguntas || 20),
      modo,
      dificultad: item.dificultad || 'mixto',
      duracionSegundos: secondsFromMinutes(item.duracion_minutos) ?? undefined,
    });
    if (!data) throw new ApiError(400, 'No hay preguntas disponibles para esta actividad');
    await testRepository.setPlanificacion(data.testId, item.id);
    return { ...data, planificacionId: Number(item.id), origen: 'plan_estudio' };
  },

  async empezarPlantillaTest(userId, item) {
    const plantilla = await adminTestsRepository.getTest(item.plantilla_test_id);
    if (!plantilla) throw new ApiError(404, 'Test recomendado no encontrado');
    if (Number(plantilla.oposicion_id) !== Number(item.oposicion_id)) {
      throw new ApiError(400, 'El test recomendado no pertenece a esta oposicion');
    }
    const preguntaIds = (plantilla.preguntas ?? []).map((pregunta) => Number(pregunta.id)).filter(Boolean);
    if (preguntaIds.length === 0) throw new ApiError(400, 'El test recomendado no tiene preguntas');

    const test = await testRepository.createTest({
      userId,
      planificacionId: item.id,
      temaId: toNumber(plantilla.tema_id),
      oposicionId: toNumber(item.oposicion_id),
      tipoTest: 'plantilla_test',
      numeroPreguntas: preguntaIds.length,
      duracionSegundos: secondsFromMinutes(item.duracion_minutos || plantilla.duracion_minutos),
    });
    await testRepository.insertTestPreguntas(test.id, preguntaIds);
    const data = await testRepository.getTestConfig(userId, test.id);
    return { ...data, testId: Number(test.id), planificacionId: Number(item.id), origen: 'plan_estudio' };
  },

  async empezarSimulacro(userId, item) {
    const simulacro = await adminSimulacrosRepository.getSimulacro(item.simulacro_id);
    if (!simulacro) throw new ApiError(404, 'Simulacro no encontrado');
    if (Number(simulacro.oposicion_id) !== Number(item.oposicion_id)) {
      throw new ApiError(400, 'El simulacro no pertenece a esta oposicion');
    }
    const preguntaIds = (simulacro.bloques ?? [])
      .flatMap((bloque) => bloque.preguntas ?? [])
      .map((pregunta) => Number(pregunta.id))
      .filter(Boolean);
    if (preguntaIds.length === 0) throw new ApiError(400, 'El simulacro no tiene preguntas');

    const test = await testRepository.createTest({
      userId,
      planificacionId: item.id,
      oposicionId: toNumber(item.oposicion_id),
      tipoTest: 'simulacro',
      numeroPreguntas: preguntaIds.length,
      duracionSegundos: secondsFromMinutes(item.duracion_minutos) ?? toNumber(simulacro.tiempo_limite_segundos),
    });
    await testRepository.insertTestPreguntas(test.id, preguntaIds);
    const data = await testRepository.getTestConfig(userId, test.id);
    return { ...data, testId: Number(test.id), planificacionId: Number(item.id), origen: 'plan_estudio' };
  },
};
