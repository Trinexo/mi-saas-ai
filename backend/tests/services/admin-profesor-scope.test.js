import test from 'node:test';
import assert from 'node:assert/strict';
import { adminService } from '../../src/services/admin.service.js';
import { adminRepository } from '../../src/repositories/admin.repository.js';
import { ApiError } from '../../src/utils/api-error.js';

const snapshotRepo = () => ({
  listUserAssignedOposiciones: adminRepository.listUserAssignedOposiciones,
  listPreguntas: adminRepository.listPreguntas,
  countPreguntas: adminRepository.countPreguntas,
  existsTemaInOposiciones: adminRepository.existsTemaInOposiciones,
});

const restoreRepo = (snapshot) => {
  Object.entries(snapshot).forEach(([key, value]) => {
    adminRepository[key] = value;
  });
};

test('profesor sin oposiciones asignadas no puede listar preguntas', async () => {
  const snapshot = snapshotRepo();

  adminRepository.listUserAssignedOposiciones = async () => [];

  await assert.rejects(
    () => adminService.listPreguntas({ page: 1, page_size: 10 }, { userId: 100, role: 'profesor' }),
    (error) => error instanceof ApiError && error.status === 403,
  );

  restoreRepo(snapshot);
});

test('profesor con oposición asignada solo lista su ámbito', async () => {
  const snapshot = snapshotRepo();
  let receivedFilters;

  adminRepository.listUserAssignedOposiciones = async () => [1];
  adminRepository.listPreguntas = async (filters) => {
    receivedFilters = filters;
    return [];
  };
  adminRepository.countPreguntas = async () => 0;

  const result = await adminService.listPreguntas({ page: 1, page_size: 10 }, { userId: 200, role: 'profesor' });

  assert.equal(result.pagination.total, 0);
  assert.deepEqual(receivedFilters.allowedOposicionIds, [1]);

  restoreRepo(snapshot);
});

test('profesor no puede crear pregunta fuera de su oposición', async () => {
  const snapshot = snapshotRepo();

  adminRepository.listUserAssignedOposiciones = async () => [1];
  adminRepository.existsTemaInOposiciones = async () => false;

  await assert.rejects(
    () =>
      adminService.createPregunta(
        {
          temaId: 999,
          enunciado: 'Pregunta de prueba suficientemente larga',
          explicacion: 'Explicación válida',
          referenciaNormativa: null,
          nivelDificultad: 2,
          opciones: [
            { texto: 'A', correcta: true },
            { texto: 'B', correcta: false },
            { texto: 'C', correcta: false },
            { texto: 'D', correcta: false },
          ],
        },
        { userId: 300, role: 'profesor' },
      ),
    (error) => error instanceof ApiError && error.status === 403,
  );

  restoreRepo(snapshot);
});