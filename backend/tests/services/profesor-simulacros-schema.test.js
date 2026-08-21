import test from 'node:test';
import assert from 'node:assert/strict';
import {
  asignarPreguntasProfesorSchema,
  bloqueIdParamSchema,
  createBloqueProfesorSchema,
  createSimulacroProfesorSchema,
  misSimulacrosQuerySchema,
  updateBloqueProfesorSchema,
} from '../../src/schemas/profesorSimulacros.schema.js';
import { profesorSimulacrosService } from '../../src/services/profesorSimulacros.service.js';
import { profesorAccessRepository } from '../../src/repositories/profesorAccess.repository.js';
import { profesorSimulacrosRepository } from '../../src/repositories/profesorSimulacros.repository.js';
import { adminSimulacrosRepository } from '../../src/repositories/adminSimulacros.repository.js';

const visibilityOriginals = {
  getSimulacro: adminSimulacrosRepository.getSimulacro,
  getSimulacroCreatorInfo: profesorSimulacrosRepository.getSimulacroCreatorInfo,
  hasAssignedOposicion: profesorAccessRepository.hasAssignedOposicion,
};

const restoreVisibilityStubs = () => {
  adminSimulacrosRepository.getSimulacro = visibilityOriginals.getSimulacro;
  profesorSimulacrosRepository.getSimulacroCreatorInfo = visibilityOriginals.getSimulacroCreatorInfo;
  profesorAccessRepository.hasAssignedOposicion = visibilityOriginals.hasAssignedOposicion;
};

test.afterEach(restoreVisibilityStubs);

function stubVisibleSimulacro({ creatorId = '900', role = 'profesor', assigned = true } = {}) {
  adminSimulacrosRepository.getSimulacro = async () => ({
    id: '700', oposicion_id: '42', creado_por: creatorId, nombre: 'Simulacro compartido', bloques: [],
  });
  profesorSimulacrosRepository.getSimulacroCreatorInfo = async () => ({
    creado_por: creatorId, creador_role: role,
  });
  profesorAccessRepository.hasAssignedOposicion = async () => assigned;
}

test('misSimulacrosQuerySchema normaliza filtros paginados', () => {
  const result = misSimulacrosQuerySchema.parse({
    oposicion_id: '7',
    page: '2',
    page_size: '50',
    estado: 'publicado',
  });

  assert.equal(result.oposicion_id, 7);
  assert.equal(result.page, 2);
  assert.equal(result.page_size, 50);
  assert.equal(result.estado, 'publicado');
});

test('createSimulacroProfesorSchema normaliza numeros de formulario', () => {
  const result = createSimulacroProfesorSchema.parse({
    nombre: 'Simulacro oficial',
    oposicion_id: '12',
    tiempo_limite_segundos: '3600',
    puntuacion_maxima: '100',
    penalizacion: '0.25',
  });

  assert.equal(result.oposicion_id, 12);
  assert.equal(result.tiempo_limite_segundos, 3600);
  assert.equal(result.puntuacion_maxima, 100);
  assert.equal(result.penalizacion, 0.25);
});

test('createBloqueProfesorSchema normaliza orden y numero de preguntas', () => {
  const result = createBloqueProfesorSchema.parse({
    nombre: 'Bloque 1',
    orden: '0',
    numero_preguntas: '25',
  });

  assert.equal(result.orden, 0);
  assert.equal(result.numero_preguntas, 25);
});

test('updateBloqueProfesorSchema rechaza payload vacio y normaliza parcial', () => {
  assert.equal(updateBloqueProfesorSchema.safeParse({}).success, false);

  const result = updateBloqueProfesorSchema.parse({ numero_preguntas: '30' });
  assert.equal(result.numero_preguntas, 30);
});

test('asignarPreguntasProfesorSchema normaliza ids de preguntas', () => {
  const result = asignarPreguntasProfesorSchema.parse({ pregunta_ids: ['1', '2'] });
  assert.deepEqual(result.pregunta_ids, [1, 2]);
});

test('params de simulacro profesor normalizan ids', () => {
  const result = bloqueIdParamSchema.parse({ id: '3', bloqueId: '4' });
  assert.deepEqual(result, { id: 3, bloqueId: 4 });
});

test('schemas de simulacro profesor rechazan valores invalidos', () => {
  assert.equal(misSimulacrosQuerySchema.safeParse({ page_size: '500' }).success, false);
  assert.equal(createSimulacroProfesorSchema.safeParse({ nombre: 'Ok', penalizacion: '2' }).success, false);
  assert.equal(asignarPreguntasProfesorSchema.safeParse({ pregunta_ids: ['abc'] }).success, false);
});

test('profesor asignado puede ver simulacros de otro profesor y de admin', async () => {
  stubVisibleSimulacro({ creatorId: '900', role: 'profesor' });
  const otherTeacher = await profesorSimulacrosService.getSimulacro('901', '700');
  assert.equal(otherTeacher.es_propietario, false);
  assert.equal(otherTeacher.origen, 'profesor');

  stubVisibleSimulacro({ creatorId: '1', role: 'admin' });
  const adminSimulacro = await profesorSimulacrosService.getSimulacro('901', '700');
  assert.equal(adminSimulacro.es_propietario, false);
  assert.equal(adminSimulacro.origen, 'admin');
});

test('profesor no asignado no puede acceder al simulacro por ID', async () => {
  stubVisibleSimulacro({ assigned: false });
  await assert.rejects(
    () => profesorSimulacrosService.getSimulacro('901', '700'),
    (error) => error.status === 403 && /oposicion/i.test(error.message),
  );
});

test('simulacro compartido es visible pero no modificable por otro profesor', async () => {
  stubVisibleSimulacro({ creatorId: '900', role: 'profesor' });
  await assert.rejects(
    () => profesorSimulacrosService.getSimulacroEditable('901', '700'),
    (error) => error.status === 403 && /modificar/i.test(error.message),
  );
});

test('propietario conserva permisos con IDs BIGINT como strings', async () => {
  stubVisibleSimulacro({ creatorId: '9007199254740993', role: 'profesor' });
  const data = await profesorSimulacrosService.getSimulacroEditable('9007199254740993', '7000000000000001');
  assert.equal(data.es_propietario, true);
  assert.equal(data.origen, 'profesor');
  assert.equal(Object.hasOwn(data, 'creado_por'), false);
});
