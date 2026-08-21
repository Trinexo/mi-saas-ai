import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { albacerAlumnoRepository } from '../../src/repositories/albacerAlumno.repository.js';
import { albacerProgressRepository } from '../../src/repositories/albacerProgress.repository.js';
import { albacerAlumnoService } from '../../src/services/albacerAlumno.service.js';
import { albacerProgressService } from '../../src/services/albacerProgress.service.js';
import { accessContextService } from '../../src/services/accessContext.service.js';

const repositories = [albacerAlumnoRepository, albacerProgressRepository, accessContextService];
const originals = repositories.map((repository) => ({ repository, methods: { ...repository } }));
const restore = () => originals.forEach(({ repository, methods }) => Object.assign(repository, methods));

function modulo({ modulePassed = false, firstPassed = false, firstAttempts = 0 } = {}) {
  return [{ id: 10, oposicion_id: 20, orden: 1, progreso: { estado: modulePassed ? 'superado' : 'disponible' }, items: [
    { id: 101, modulo_id: 10, tipo: 'test', obligatorio: true, orden: 1, progreso: { superado: firstPassed, intentos: firstAttempts, mejor_nota: firstPassed ? 5 : null, ultima_nota: firstPassed ? 5 : null } },
    { id: 102, modulo_id: 10, tipo: 'test', obligatorio: true, orden: 2, progreso: { superado: false, intentos: 0 } },
    { id: 103, modulo_id: 10, tipo: 'test', obligatorio: false, orden: 3, progreso: { superado: false, intentos: 0 } },
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
  assert.equal(items[1].estado, 'available');
});

test('D-006: el final superado desbloquea sin aprobar artificialmente los tests', async () => {
  allowGuided(modulo({ modulePassed: true }));
  const items = (await albacerAlumnoService.listModulos('1', '20')).items[0].items;
  assert.deepEqual(items.map((item) => item.estado), ['available', 'available', 'available', 'passed']);
  assert.equal(items[0].superado, false);
  assert.equal(items[1].superado, false);
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
