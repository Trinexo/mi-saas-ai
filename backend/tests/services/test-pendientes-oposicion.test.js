import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { testPendientesService } from '../../src/services/testPendientes.service.js';

const originalQuery = pool.query;

afterEach(() => {
  pool.query = originalQuery;
});

describe('testPendientesService.getPendientes', () => {
  it('pasa oposicion_id opcional a la consulta de pendientes', async () => {
    let receivedParams = null;
    pool.query = async (_sql, params) => {
      receivedParams = params;
      return { rows: [] };
    };

    await testPendientesService.getPendientes(7, 12);

    assert.deepEqual(receivedParams, [7, 12, null]);
  });

  it('pasa modo_preparacion opcional a la consulta de pendientes', async () => {
    let receivedParams = null;
    pool.query = async (_sql, params) => {
      receivedParams = params;
      return { rows: [] };
    };

    await testPendientesService.getPendientes(7, 12, 'albacer');

    assert.deepEqual(receivedParams, [7, 12, 'albacer']);
  });
});
