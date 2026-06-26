import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { simulacrosPublicosService } from '../../src/services/simulacrosPublicos.service.js';
import { simulacrosPublicosRepository } from '../../src/repositories/simulacrosPublicos.repository.js';
import { accesoOposicionRepository } from '../../src/repositories/accesoOposicion.repository.js';
import pool from '../../src/config/db.js';

const originalGetAccesosActivos = accesoOposicionRepository.getAccesosActivos;
const originalGetPublicados = simulacrosPublicosRepository.getPublicados;
const originalQuery = pool.query;

afterEach(() => {
  accesoOposicionRepository.getAccesosActivos = originalGetAccesosActivos;
  simulacrosPublicosRepository.getPublicados = originalGetPublicados;
  pool.query = originalQuery;
});

describe('simulacrosPublicosService.getPublicados', () => {
  it('filtra por oposicion activa cuando se recibe oposicion_id', async () => {
    let receivedIds = null;
    accesoOposicionRepository.getAccesosActivos = async () => [
      { oposicion_id: 10, tipo_alumno: 'albacer' },
      { oposicion_id: 20, tipo_alumno: 'albacer' },
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
    accesoOposicionRepository.getAccesosActivos = async () => [{ oposicion_id: 10, tipo_alumno: 'albacer' }];
    simulacrosPublicosRepository.getPublicados = async (oposicionIds) => {
      receivedIds = oposicionIds;
      return [];
    };

    await simulacrosPublicosService.getPublicados(1, 99);

    assert.deepEqual(receivedIds, []);
  });

  it('excluye simulacros sugeridos para accesos de alumno libre', async () => {
    let receivedIds = null;
    accesoOposicionRepository.getAccesosActivos = async () => [
      { oposicion_id: 10, tipo_alumno: 'libre' },
      { oposicion_id: 20, tipo_alumno: 'albacer' },
    ];
    simulacrosPublicosRepository.getPublicados = async (oposicionIds) => {
      receivedIds = oposicionIds;
      return [];
    };

    await simulacrosPublicosService.getPublicados(1);

    assert.deepEqual(receivedIds, [20]);
  });
});

describe('simulacrosPublicosRepository', () => {
  it('excluye simulacros finales de modulo Albacer del listado publico', async () => {
    let receivedSql = '';
    pool.query = async (sql) => {
      receivedSql = sql;
      return { rows: [] };
    };

    await simulacrosPublicosRepository.getPublicados([10]);

    assert.match(receivedSql, /COALESCE\(s\.scope, 'experto'\) <> 'albacer_modulo_final'/);
  });
});
