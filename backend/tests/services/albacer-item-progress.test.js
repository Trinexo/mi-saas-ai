import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { albacerAlumnoRepository } from '../../src/repositories/albacerAlumno.repository.js';
import { albacerProgressRepository } from '../../src/repositories/albacerProgress.repository.js';
import { albacerAlumnoService } from '../../src/services/albacerAlumno.service.js';
import { albacerProgressService } from '../../src/services/albacerProgress.service.js';
import { accessContextService } from '../../src/services/accessContext.service.js';
import pool from '../../src/config/db.js';

const repositories = [albacerAlumnoRepository, albacerProgressRepository, accessContextService];
const originals = repositories.map((repository) => ({ repository, methods: { ...repository } }));
const restore = () => originals.forEach(({ repository, methods }) => Object.assign(repository, methods));

function modulo({ modulePassed = false, firstPassed = false, firstAttempts = 0, completedByFinal = false } = {}) {
  return [{ id: 10, oposicion_id: 20, orden: 1, progreso: { estado: modulePassed ? 'superado' : 'disponible' }, items: [
    { id: 101, modulo_id: 10, tipo: 'test', obligatorio: true, orden: 1, progreso: { superado: firstPassed || completedByFinal, intentos: firstAttempts, mejor_nota: firstPassed ? 5 : null, ultima_nota: firstPassed ? 5 : null } },
    { id: 102, modulo_id: 10, tipo: 'test', obligatorio: true, orden: 2, progreso: { superado: completedByFinal, intentos: 0 } },
    { id: 103, modulo_id: 10, tipo: 'test', obligatorio: false, orden: 3, progreso: { superado: completedByFinal, intentos: 0 } },
    { id: 104, modulo_id: 10, tipo: 'simulacro_final', obligatorio: true, orden: 4, progreso: { superado: false, intentos: 0 } },
  ] }];
}

function allowGuided(modules) {
  accessContextService.obtenerContextoUsuario = async () => ({ oposicion_id: '20', permisos: { puede_acceder_contenido: true, puede_usar_guiado: true } });
  albacerAlumnoRepository.getAcceso = async () => ({ tipo_alumno: 'albacer', modo_preparacion: 'albacer' });
  albacerAlumnoRepository.listModulos = async () => modules;
  albacerAlumnoRepository.upsertModuloDisponible = async () => {};
}

test.afterEach(restore);

test('D-006: estado inicial bloquea solo el segundo obligatorio y deja disponible el final', async () => {
  allowGuided(modulo());
  const items = (await albacerAlumnoService.listModulos('1', '20')).items[0].items;
  assert.deepEqual(items.map((item) => item.estado), ['available', 'locked', 'available', 'available']);
});

test('D-006: superar el anterior desbloquea el siguiente y conserva datos académicos', async () => {
  allowGuided(modulo({ firstPassed: true, firstAttempts: 2 }));
  const items = (await albacerAlumnoService.listModulos('1', '20')).items[0].items;
  assert.equal(items[0].estado, 'passed');
  assert.equal(items[0].intentos, 2);
  assert.equal(items[0].superado_por, 'intento');
  assert.equal(items[1].estado, 'available');
});

test('D-006: suspender el primer obligatorio lo deja en curso y mantiene bloqueado el segundo', async () => {
  allowGuided(modulo({ firstAttempts: 1 }));
  const items = (await albacerAlumnoService.listModulos('1', '20')).items[0].items;
  assert.deepEqual(items.slice(0, 2).map((item) => item.estado), ['in_progress', 'locked']);
});

test('D-006: el final superado completa todos los tests sin inventar historial', async () => {
  allowGuided(modulo({ modulePassed: true }));
  const items = (await albacerAlumnoService.listModulos('1', '20')).items[0].items;
  assert.deepEqual(items.map((item) => item.estado), ['passed', 'passed', 'passed', 'passed']);
  assert.deepEqual(items.slice(0, 3).map((item) => item.intentos), [0, 0, 0]);
  assert.deepEqual(items.slice(0, 3).map((item) => item.mejor_nota), [null, null, null]);
  assert.deepEqual(items.slice(0, 3).map((item) => item.superado_por), ['simulacro_final', 'simulacro_final', 'simulacro_final']);
});

test('D-006: un test completado por final sigue disponible para repetirse', async () => {
  allowGuided(modulo({ modulePassed: true, completedByFinal: true }));
  albacerAlumnoRepository.getItemForAlumno = async () => ({ id: 102, modulo_id: 10, oposicion_id: 20, tipo: 'test' });
  albacerAlumnoRepository.getModuloForAlumno = async () => ({ id: 10, oposicion_id: 20 });
  const original = albacerAlumnoService.empezarPlantilla;
  try {
    albacerAlumnoService.empezarPlantilla = async () => ({ testId: 999 });
    assert.deepEqual(await albacerAlumnoService.empezarItem('1', '102'), { testId: 999 });
  } finally {
    albacerAlumnoService.empezarPlantilla = original;
  }
});

test('D-006: recargar conserva la finalizacion derivada del repositorio', async () => {
  allowGuided(modulo({ modulePassed: true }));
  const firstLoad = await albacerAlumnoService.listModulos('1', '20');
  const reload = await albacerAlumnoService.listModulos('1', '20');
  assert.deepEqual(
    reload.items[0].items.map((item) => item.estado),
    firstLoad.items[0].items.map((item) => item.estado),
  );
  assert.deepEqual(reload.items[0].items.map((item) => item.estado), ['passed', 'passed', 'passed', 'passed']);
});

test('D-006: superar el final deja disponible el primer obligatorio del siguiente modulo', async () => {
  const completed = modulo({ modulePassed: true })[0];
  const next = {
    ...modulo()[0],
    id: 11,
    orden: 2,
    progreso: { estado: 'disponible' },
    items: modulo()[0].items.map((item) => ({ ...item, id: item.id + 10, modulo_id: 11 })),
  };
  allowGuided([completed, next]);
  const modules = (await albacerAlumnoService.listModulos('1', '20')).items;
  assert.equal(modules[1].estado_calculado, 'disponible');
  assert.equal(modules[1].items[0].estado, 'available');
  assert.equal(modules[1].items[1].estado, 'locked');
});

test('D-006: empezarItem rechaza por backend un obligatorio bloqueado', async () => {
  allowGuided(modulo());
  albacerAlumnoRepository.getItemForAlumno = async () => ({ id: 102, modulo_id: 10, oposicion_id: 20, tipo: 'test' });
  albacerAlumnoRepository.getModuloForAlumno = async () => ({ id: 10, oposicion_id: 20 });
  await assert.rejects(() => albacerAlumnoService.empezarItem('1', '102'), (error) => error.status === 403 && /test obligatorio anterior/.test(error.message));
});

test('D-006: nota 5 supera y una repetición 2 no revierte mejor/última', async () => {
  albacerProgressRepository.getAttemptContext = async () => ({ item_tipo: 'test', obligatorio: true, albacer_modulo_id: '10', albacer_item_id: '101' });
  let progress = { superado: true, intentos: 1, mejor_nota: '5.00', ultima_nota: '5.00' };
  albacerProgressRepository.refreshMandatoryItemProgress = async () => progress;
  const passed = await albacerProgressService.processAttempt({ userId: '1', testId: '201', nota: 5 });
  assert.equal(passed.superadoIntento, true);
  progress = { superado: true, intentos: 2, mejor_nota: '5.00', ultima_nota: '2.00' };
  const repeated = await albacerProgressService.processAttempt({ userId: '1', testId: '202', nota: 2 });
  assert.deepEqual({ passed: repeated.superado, best: repeated.mejorNota, last: repeated.ultimaNota, attempts: repeated.intentos }, { passed: true, best: 5, last: 2, attempts: 2 });
});

test('D-006: nota 4.9 no supera y un item no obligatorio no genera progreso', async () => {
  albacerProgressRepository.getAttemptContext = async () => ({ item_tipo: 'test', obligatorio: true, albacer_modulo_id: '10', albacer_item_id: '101' });
  albacerProgressRepository.refreshMandatoryItemProgress = async () => ({ superado: false, intentos: 1, mejor_nota: '4.90', ultima_nota: '4.90' });
  assert.equal((await albacerProgressService.processAttempt({ userId: '1', testId: '201', nota: 4.9 })).superadoIntento, false);
  albacerProgressRepository.getAttemptContext = async () => ({ item_tipo: 'test', obligatorio: false });
  let refreshed = false;
  albacerProgressRepository.refreshMandatoryItemProgress = async () => { refreshed = true; };
  assert.equal(await albacerProgressService.processAttempt({ userId: '1', testId: '202', nota: 10 }), null);
  assert.equal(refreshed, false);
});

test('D-006: aprobar el final completa items y desbloquea el modulo siguiente', async () => {
  albacerProgressRepository.getAttemptContext = async () => ({
    item_tipo: 'simulacro_final', albacer_modulo_id: '10', albacer_item_id: '104', simulacro_id: '30',
    numero_preguntas: 10, criterio_superacion: 'nota', valor_superacion: 5,
  });
  albacerProgressRepository.upsertFinalAttemptProgress = async () => ({ mejor_nota: 8, mejor_porcentaje: 80 });
  let completed;
  albacerProgressRepository.completeModuleItemsFromFinal = async (userId, moduloId) => {
    completed = { userId, moduloId };
    return [101, 102, 103];
  };
  albacerProgressRepository.unlockNextModulo = async () => 11;

  const result = await albacerProgressService.processAttempt({ userId: '1', testId: '204', aciertos: 8, nota: 8 });
  assert.deepEqual(completed, { userId: '1', moduloId: 10 });
  assert.deepEqual(result.itemsCompletados, [101, 102, 103]);
  assert.equal(result.siguienteModuloId, 11);
});

test('D-006: suspender el final no completa items ni desbloquea el siguiente modulo', async () => {
  albacerProgressRepository.getAttemptContext = async () => ({
    item_tipo: 'simulacro_final', albacer_modulo_id: '10', albacer_item_id: '104', simulacro_id: '30',
    numero_preguntas: 10, criterio_superacion: 'nota', valor_superacion: 5,
  });
  albacerProgressRepository.upsertFinalAttemptProgress = async () => ({ mejor_nota: 4, mejor_porcentaje: 40 });
  let completed = false;
  let unlocked = false;
  albacerProgressRepository.completeModuleItemsFromFinal = async () => { completed = true; };
  albacerProgressRepository.unlockNextModulo = async () => { unlocked = true; };

  const result = await albacerProgressService.processAttempt({ userId: '1', testId: '204', aciertos: 4, nota: 4 });
  assert.deepEqual(result.itemsCompletados, []);
  assert.equal(completed, false);
  assert.equal(unlocked, false);
});

test('D-006: completar por final solo cambia la marca de superacion', () => {
  const source = fs.readFileSync(path.resolve(import.meta.dirname, '../../src/repositories/albacerProgress.repository.js'), 'utf8');
  const method = source.slice(source.indexOf('async completeModuleItemsFromFinal'), source.indexOf('async unlockNextModulo'));
  assert.match(method, /mi\.tipo = 'test'/);
  assert.match(method, /superado = TRUE/);
  assert.doesNotMatch(method, /intentos\s*=/);
  assert.doesNotMatch(method, /mejor_nota\s*=/);
  assert.doesNotMatch(method, /ultima_nota\s*=/);
  assert.doesNotMatch(method, /INSERT INTO resultados_test/);
});

test('049 crea progreso individual y backfill inequívoco e idempotente', () => {
  const sql = fs.readFileSync(path.resolve(import.meta.dirname, '../../../database/migrations/049_albacer_item_progress.sql'), 'utf8');
  assert.match(sql, /PRIMARY KEY \(usuario_id, item_id\)/);
  assert.match(sql, /t\.modo_preparacion = 'albacer'/);
  assert.match(sql, /mi\.tipo = 'test'/);
  assert.match(sql, /mi\.obligatorio = TRUE/);
  assert.match(sql, /BOOL_OR\(rt\.nota >= 5\.00\)/);
  assert.match(sql, /ON CONFLICT \(usuario_id, item_id\) DO NOTHING/);
});

test('el refresco deriva intentos y evita incrementos vulnerables a duplicados', () => {
  const source = fs.readFileSync(path.resolve(import.meta.dirname, '../../src/repositories/albacerProgress.repository.js'), 'utf8');
  assert.match(source, /COUNT\(\*\)::int AS intentos/);
  assert.match(source, /BOOL_OR\(rt\.nota >= 5\.00\) AS superado/);
  assert.doesNotMatch(source, /intentos\s*=\s*albacer_item_progreso\.intentos\s*\+/);
});

test('D-006: listado reconcilia intentos historicos directos y por plantilla inequivoca', async () => {
  const originalQuery = pool.query;
  let sql = '';
  pool.query = async (query) => {
    sql = query;
    return { rows: [] };
  };
  try {
    await albacerAlumnoRepository.listModulos(1024, 1008);
  } finally {
    pool.query = originalQuery;
  }

  assert.match(sql, /t\.albacer_item_id = mi\.id/);
  assert.match(sql, /t\.albacer_item_id IS NULL/);
  assert.match(sql, /scoring_snapshot ->> 'plantilla_test_id'/);
  assert.match(sql, /t\.albacer_modulo_id = mi\.modulo_id/);
  assert.match(sql, /NOT EXISTS/);
  assert.match(sql, /BOOL_OR\(rt\.nota >= 5\.00\) AS superado/);
  assert.match(sql, /COUNT\(\*\)::int AS intentos/);
});
