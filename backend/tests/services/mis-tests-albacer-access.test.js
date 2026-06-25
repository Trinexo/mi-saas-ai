import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { misTestsService } from '../../src/services/misTests.service.js';
import { misTestsRepository } from '../../src/repositories/misTests.repository.js';
import { accesoOposicionRepository } from '../../src/repositories/accesoOposicion.repository.js';

const originalGetAccesosActivos = accesoOposicionRepository.getAccesosActivos;
const originalGetPublicados = misTestsRepository.getPublicados;

afterEach(() => {
  accesoOposicionRepository.getAccesosActivos = originalGetAccesosActivos;
  misTestsRepository.getPublicados = originalGetPublicados;
});

describe('misTestsService.getPublicados', () => {
  it('solo devuelve tests sugeridos para oposiciones con alumno Albacer', async () => {
    let received = null;
    accesoOposicionRepository.getAccesosActivos = async () => [
      { oposicion_id: 10, tipo_alumno: 'libre' },
      { oposicion_id: 20, tipo_alumno: 'albacer' },
    ];
    misTestsRepository.getPublicados = async (oposicionIds, plan, includeOnlyDemo) => {
      received = { oposicionIds, plan, includeOnlyDemo };
      return [];
    };

    await misTestsService.getPublicados(1, 'pro');

    assert.deepEqual(received, {
      oposicionIds: [20],
      plan: 'pro',
      includeOnlyDemo: false,
    });
  });

  it('si el acceso es libre solo pide tests demo', async () => {
    let received = null;
    accesoOposicionRepository.getAccesosActivos = async () => [
      { oposicion_id: 10, tipo_alumno: 'libre' },
    ];
    misTestsRepository.getPublicados = async (oposicionIds, plan, includeOnlyDemo) => {
      received = { oposicionIds, plan, includeOnlyDemo };
      return [];
    };

    await misTestsService.getPublicados(1, 'free', 10);

    assert.deepEqual(received, {
      oposicionIds: [10],
      plan: 'free',
      includeOnlyDemo: true,
    });
  });
});
