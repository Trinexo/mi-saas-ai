import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { planEstudioService } from '../../src/services/planEstudio.service.js';
import { profesorWorkspacePlanificacionRepository } from '../../src/repositories/profesorWorkspacePlanificacion.repository.js';
import { accesoOposicionRepository } from '../../src/repositories/accesoOposicion.repository.js';
import { adminTestsRepository } from '../../src/repositories/adminTests.repository.js';
import { adminSimulacrosRepository } from '../../src/repositories/adminSimulacros.repository.js';
import { testRepository } from '../../src/repositories/test.repository.js';
import { testService } from '../../src/services/test.service.js';

const originals = {
  tieneAcceso: accesoOposicionRepository.tieneAcceso,
  getPreparacion: accesoOposicionRepository.getPreparacion,
  listForAlumno: profesorWorkspacePlanificacionRepository.listForAlumno,
  getForAlumno: profesorWorkspacePlanificacionRepository.getForAlumno,
  getTest: adminTestsRepository.getTest,
  getSimulacro: adminSimulacrosRepository.getSimulacro,
  setPlanificacion: testRepository.setPlanificacion,
  generate: testService.generate,
};

afterEach(() => {
  accesoOposicionRepository.tieneAcceso = originals.tieneAcceso;
  accesoOposicionRepository.getPreparacion = originals.getPreparacion;
  profesorWorkspacePlanificacionRepository.listForAlumno = originals.listForAlumno;
  profesorWorkspacePlanificacionRepository.getForAlumno = originals.getForAlumno;
  adminTestsRepository.getTest = originals.getTest;
  adminSimulacrosRepository.getSimulacro = originals.getSimulacro;
  testRepository.setPlanificacion = originals.setPlanificacion;
  testService.generate = originals.generate;
});

describe('planEstudioService', () => {
  it('list rechaza oposiciones sin acceso del alumno', async () => {
    accesoOposicionRepository.getPreparacion = async () => null;

    await assert.rejects(
      () => planEstudioService.list(7, { oposicion_id: 22 }),
      (error) => error.status === 403 && error.message.includes('acceso'),
    );
  });

  it('list devuelve actividades solo si el alumno tiene acceso', async () => {
    accesoOposicionRepository.getPreparacion = async () => ({ modo_preparacion: 'experto' });
    profesorWorkspacePlanificacionRepository.listForAlumno = async ({ userId, oposicionId }) => {
      assert.equal(userId, 7);
      assert.equal(oposicionId, 22);
      return [{ id: 1, titulo: 'Tema recomendado' }];
    };

    const result = await planEstudioService.list(7, { oposicion_id: 22 });

    assert.deepEqual(result.items, [{ id: 1, titulo: 'Tema recomendado' }]);
  });

  it('list bloquea el plan legacy en Modo Albacer', async () => {
    accesoOposicionRepository.getPreparacion = async () => ({ modo_preparacion: 'albacer' });

    await assert.rejects(
      () => planEstudioService.list(7, { oposicion_id: 22 }),
      (error) => error.status === 410 && error.details?.code === 'LEGACY_PLAN_DISABLED_IN_ALBACER',
    );
  });

  it('empezar rechaza actividades no disponibles', async () => {
    accesoOposicionRepository.getPreparacion = async () => ({ modo_preparacion: 'experto' });
    profesorWorkspacePlanificacionRepository.getForAlumno = async () => ({
      id: 9,
      oposicion_id: 22,
      estado_alumno: 'proximo',
      tipo: 'tema_recomendado',
    });

    await assert.rejects(
      () => planEstudioService.empezar(7, 9),
      (error) => error.status === 400 && error.message.includes('disponible'),
    );
  });

  it('empezarTemaRecomendado crea test y vincula planificacion', async () => {
    let generatePayload = null;
    let linked = null;

    testService.generate = async (payload) => {
      generatePayload = payload;
      return { testId: 77, preguntas: [] };
    };
    testRepository.setPlanificacion = async (testId, planificacionId) => {
      linked = { testId, planificacionId };
    };

    const result = await planEstudioService.empezarTemaRecomendado(7, {
      id: 9,
      oposicion_id: 22,
      numero_preguntas: 12,
      dificultad: 'media',
      modo_test: 'normal',
      duracion_minutos: 30,
      temas: [
        { id: 101, nombre: 'Tema 1' },
        { id: 102, nombre: 'Tema 2' },
      ],
    });

    assert.equal(generatePayload.userId, 7);
    assert.equal(generatePayload.oposicionId, 22);
    assert.equal(generatePayload.numeroPreguntas, 12);
    assert.equal(generatePayload.duracionSegundos, 1800);
    assert.deepEqual(generatePayload.temasMix, [
      { temaId: 101, pct: 50 },
      { temaId: 102, pct: 50 },
    ]);
    assert.deepEqual(linked, { testId: 77, planificacionId: 9 });
    assert.equal(result.planificacionId, 9);
    assert.equal(result.origen, 'plan_estudio');
  });

  it('empezarPlantillaTest rechaza tests de otra oposicion', async () => {
    adminTestsRepository.getTest = async () => ({
      id: 31,
      oposicion_id: 99,
      preguntas: [{ id: 1 }],
    });

    await assert.rejects(
      () => planEstudioService.empezarPlantillaTest(7, {
        id: 9,
        oposicion_id: 22,
        plantilla_test_id: 31,
      }),
      (error) => error.status === 400 && error.message.includes('no pertenece'),
    );
  });

  it('empezarSimulacro rechaza simulacros de otra oposicion', async () => {
    adminSimulacrosRepository.getSimulacro = async () => ({
      id: 41,
      oposicion_id: 99,
      bloques: [{ preguntas: [{ id: 1 }] }],
    });

    await assert.rejects(
      () => planEstudioService.empezarSimulacro(7, {
        id: 9,
        oposicion_id: 22,
        simulacro_id: 41,
      }),
      (error) => error.status === 400 && error.message.includes('no pertenece'),
    );
  });
});
