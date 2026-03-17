import test from 'node:test';
import assert from 'node:assert/strict';
import { adminService } from '../../src/services/admin.service.js';
import { adminRepository } from '../../src/repositories/admin.repository.js';
import { ApiError } from '../../src/utils/api-error.js';

const snapshotRepo = () => ({
  listAuditoria: adminRepository.listAuditoria,
  countAuditoria: adminRepository.countAuditoria,
});

const restoreRepo = (snapshot) => {
  Object.entries(snapshot).forEach(([key, value]) => {
    adminRepository[key] = value;
  });
};

test('listAuditoria: solo admin puede consultar', async () => {
  await assert.rejects(
    () => adminService.listAuditoria({ page: 1, page_size: 20 }, { userId: 1, role: 'profesor' }),
    (error) => error instanceof ApiError && error.status === 403,
  );
});

test('listAuditoria: admin recibe items paginados', async () => {
  const snapshot = snapshotRepo();
  const fakeItems = [
    { id: 1, accion: 'create', pregunta_id: 10, usuario_id: 1, usuario_role: 'admin', fecha: new Date(), usuario_email: 'a@b.com' },
  ];

  adminRepository.listAuditoria = async () => fakeItems;
  adminRepository.countAuditoria = async () => 1;

  const result = await adminService.listAuditoria(
    { page: 1, page_size: 20 },
    { userId: 1, role: 'admin' },
  );

  assert.equal(result.items.length, 1);
  assert.equal(result.pagination.total, 1);
  assert.equal(result.pagination.page, 1);

  restoreRepo(snapshot);
});

test('listAuditoria: sin actor lanza 403', async () => {
  await assert.rejects(
    () => adminService.listAuditoria({ page: 1, page_size: 20 }, null),
    (error) => error instanceof ApiError && error.status === 403,
  );
});
