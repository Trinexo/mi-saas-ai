import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { widgetEngagementFocoTemasRepository } from '../../src/repositories/widgetEngagementFocoTemas.repository.js';

test('getTemasDebiles calcula por modo y modulo desde tests finalizados', async () => {
  const originalQuery = pool.query;
  const calls = [];

  pool.query = async (sql, params) => {
    calls.push({ sql: String(sql), params });
    return { rows: [] };
  };

  try {
    const result = await widgetEngagementFocoTemasRepository.getTemasDebiles(
      7,
      21,
      { modoPreparacion: 'albacer', albacerModuloId: 4 },
    );

    assert.deepEqual(result, []);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].params, [7, 21, 'albacer', 4]);
    assert.match(calls[0].sql, /FROM tests ts/);
    assert.match(calls[0].sql, /JOIN respuestas_usuario ru ON ru\.test_id = ts\.id/);
    assert.match(calls[0].sql, /ts\.modo_preparacion, 'experto'\) = \$3/);
    assert.match(calls[0].sql, /ts\.albacer_modulo_id = \$4/);
  } finally {
    pool.query = originalQuery;
  }
});
