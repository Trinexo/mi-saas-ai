import test from 'node:test';
import assert from 'node:assert/strict';
import { albacerModulosService } from '../../src/services/albacerModulos.service.js';
import { albacerModulosRepository } from '../../src/repositories/albacerModulos.repository.js';
import { profesorAccessRepository } from '../../src/repositories/profesorAccess.repository.js';
import { ApiError } from '../../src/utils/api-error.js';

function snapshot(...repos) {
  return repos.map((repo) => ({ repo, copy: { ...repo } }));
}

function restore(snapshots) {
  for (const { repo, copy } of snapshots) {
    Object.keys(copy).forEach((key) => { repo[key] = copy[key]; });
  }
}

const BASE_MODULO = {
  id: 1,
  oposicion_id: 10,
  nombre: 'Modulo 1',
  descripcion: null,
  orden: 1,
  estado: 'borrador',
  tema_ids: [100],
  temas: [{ id: 100, nombre: 'Tema 1' }],
};

test('albacerModulosService.list filtra oposiciones asignadas para profesor', async () => {
  const snaps = snapshot(albacerModulosRepository, profesorAccessRepository);
  profesorAccessRepository.listAssignedOposicionIds = async () => [10, 20];
  let captured;
  albacerModulosRepository.list = async (filters) => {
    captured = filters;
    return { items: [], total: 0 };
  };

  await albacerModulosService.list({ page: 1, pageSize: 20 }, { role: 'profesor', userId: 5 });

  assert.deepEqual(captured.allowedOposicionIds, [10, 20]);
  restore(snaps);
});

test('albacerModulosService.create rechaza profesor sin oposicion asignada', async () => {
  const snaps = snapshot(albacerModulosRepository, profesorAccessRepository);
  profesorAccessRepository.listAssignedOposicionIds = async () => [20];

  await assert.rejects(
    () => albacerModulosService.create(
      { oposicion_id: 10, nombre: 'Modulo 1', tema_ids: [] },
      { role: 'profesor', userId: 5 },
    ),
    (error) => error instanceof ApiError && error.status === 403,
  );

  restore(snaps);
});

test('albacerModulosService.create valida que los temas pertenezcan a la oposicion', async () => {
  const snaps = snapshot(albacerModulosRepository, profesorAccessRepository);
  profesorAccessRepository.listAssignedOposicionIds = async () => [10];
  albacerModulosRepository.countTemasInOposicion = async () => 1;

  await assert.rejects(
    () => albacerModulosService.create(
      { oposicion_id: 10, nombre: 'Modulo 1', tema_ids: [100, 200] },
      { role: 'profesor', userId: 5 },
    ),
    (error) => error instanceof ApiError && error.status === 400,
  );

  restore(snaps);
});

test('albacerModulosService.create guarda modulo y temas normalizados', async () => {
  const snaps = snapshot(albacerModulosRepository, profesorAccessRepository);
  profesorAccessRepository.listAssignedOposicionIds = async () => [10];
  albacerModulosRepository.countTemasInOposicion = async () => 2;
  albacerModulosRepository.create = async () => ({ id: 1 });
  let replaced;
  albacerModulosRepository.replaceTemas = async (moduloId, temaIds) => {
    replaced = { moduloId, temaIds };
  };
  albacerModulosRepository.get = async () => BASE_MODULO;

  const result = await albacerModulosService.create(
    { oposicion_id: 10, nombre: 'Modulo 1', tema_ids: [100, 100, 200] },
    { role: 'profesor', userId: 5 },
  );

  assert.equal(result.id, 1);
  assert.deepEqual(replaced, { moduloId: 1, temaIds: [100, 200] });
  restore(snaps);
});

test('albacerModulosService.update no borra temas si tema_ids no viene en payload', async () => {
  const snaps = snapshot(albacerModulosRepository, profesorAccessRepository);
  profesorAccessRepository.listAssignedOposicionIds = async () => [10];
  albacerModulosRepository.get = async () => BASE_MODULO;
  albacerModulosRepository.countTemasInOposicion = async () => 1;
  albacerModulosRepository.update = async () => ({ id: 1 });
  let replaceCalled = false;
  albacerModulosRepository.replaceTemas = async () => { replaceCalled = true; };

  await albacerModulosService.update(1, { nombre: 'Modulo actualizado' }, { role: 'profesor', userId: 5 });

  assert.equal(replaceCalled, false);
  restore(snaps);
});
