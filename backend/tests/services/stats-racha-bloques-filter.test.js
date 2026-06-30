import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { widgetEngagementRachaStreaksRepository } from '../../src/repositories/widgetEngagementRachaStreaks.repository.js';

test('getRachaBloques filtra por oposicion, modo y modulo Albacer', async () => {
  const originalQuery = pool.query;
  let receivedSql = '';
  let receivedParams = [];

  pool.query = async (sql, params) => {
    receivedSql = String(sql);
    receivedParams = params;
    return { rows: [] };
  };

  try {
    const result = await widgetEngagementRachaStreaksRepository.getRachaBloques(
      7,
      21,
      { modoPreparacion: 'albacer', albacerModuloId: 5 },
    );

    assert.deepEqual(result, []);
    assert.deepEqual(receivedParams, [7, 21, 'albacer', 5]);
    assert.match(receivedSql, /te\.oposicion_id = \$2/);
    assert.match(receivedSql, /COALESCE\(t\.modo_preparacion, 'experto'\) = \$3/);
    assert.match(receivedSql, /t\.albacer_modulo_id = \$4/);
  } finally {
    pool.query = originalQuery;
  }
});
