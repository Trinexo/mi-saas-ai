import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { simulacrosPublicosService } from '../../src/services/simulacrosPublicos.service.js';
import { simulacrosPublicosRepository } from '../../src/repositories/simulacrosPublicos.repository.js';
import { accesoOposicionRepository } from '../../src/repositories/accesoOposicion.repository.js';

const originalGetAccesosActivos = accesoOposicionRepository.getAccesosActivos;
const originalGetPublicados = simulacrosPublicosRepository.getPublicados;

afterEach(() => {
  accesoOposicionRepository.getAccesosActivos = originalGetAccesosActivos;
  simulacrosPublicosRepository.getPublicados = originalGetPublicados;
});

describe('simulacrosPublicosService.getPublicados', () => {
  it('filtra por oposicion activa cuando se recibe oposicion_id', async () => {
    let receivedIds = null;
    accesoOposicionRepository.getAccesosActivos = async () => [
      { oposicion_id: 10 },
      { oposicion_id: 20 },
    ];
    simulacrosPublicosRepository.getPublicados = async (oposicionIds) => {
      receivedIds = oposicionIds;
      return [];
    };

    await simulacrosPublicosService.getPublicados(1, 20);

    assert.deepEqual(receivedIds, [20]);
  });

  it('devuelve lista vacia si la oposicion solicitada no esta activa para el usuario', async () => {
    let receivedIds = null;
    accesoOposicionRepository.getAccesosActivos = async () => [{ oposicion_id: 10 }];
    simulacrosPublicosRepository.getPublicados = async (oposicionIds) => {
      receivedIds = oposicionIds;
      return [];
    };

    await simulacrosPublicosService.getPublicados(1, 99);

    assert.deepEqual(receivedIds, []);
  });
});
