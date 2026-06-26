import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { repasoPendientesQuerySchema } from '../../src/schemas/repaso.schema.js';
import { repasoRepository } from '../../src/repositories/repaso.repository.js';
import { repasoService } from '../../src/services/repaso.service.js';
import pool from '../../src/config/db.js';

describe('repasoPendientesQuerySchema', () => {
  it('usa default limit=20 si no se envía query', () => {
    const r = repasoPendientesQuerySchema.safeParse({});
    assert.equal(r.success, true);
    assert.equal(r.data.limit, 20);
  });

  it('coacciona limit string a number', () => {
    const r = repasoPendientesQuerySchema.safeParse({ limit: '15' });
    assert.equal(r.success, true);
    assert.equal(r.data.limit, 15);
  });

  it('coacciona oposicion_id string a number', () => {
    const r = repasoPendientesQuerySchema.safeParse({ limit: '15', oposicion_id: '7' });
    assert.equal(r.success, true);
    assert.equal(r.data.oposicion_id, 7);
  });

  it('rechaza limit fuera de rango', () => {
    const r = repasoPendientesQuerySchema.safeParse({ limit: '0' });
    assert.equal(r.success, false);
  });
});

describe('repasoRepository', () => {
  it('getPendientes está exportado', () => {
    assert.equal(typeof repasoRepository.getPendientes, 'function');
  });

  it('filtra pendientes por oposicion_id cuando se informa', async () => {
    const originalQuery = pool.query;
    const calls = [];
    pool.query = async (sql, params) => {
      calls.push({ sql, params });
      if (String(sql).includes('COUNT(*)::int AS total') && !String(sql).includes('GROUP BY')) {
        return { rows: [{ total: 0 }], rowCount: 1 };
      }
      if (String(sql).includes('GROUP BY p.bloque_id')) {
        return { rows: [], rowCount: 0 };
      }
      return { rows: [], rowCount: 0 };
    };

    try {
      await repasoRepository.getPendientes(5, 20, 12);
    } finally {
      pool.query = originalQuery;
    }

    assert.equal(calls.length, 3);
    assert.ok(calls.every((call) => String(call.sql).includes('t.oposicion_id')));
    assert.deepEqual(calls[0].params, [5, 12]);
    assert.deepEqual(calls[1].params, [5, 12]);
    assert.deepEqual(calls[2].params, [5, 20, 12]);
  });
});

describe('repasoService', () => {
  it('getPendientes está exportado', () => {
    assert.equal(typeof repasoService.getPendientes, 'function');
  });

  it('pasa oposicionId al repositorio', async () => {
    const original = repasoRepository.getPendientes;
    let received;
    repasoRepository.getPendientes = async (...args) => {
      received = args;
      return { totalPendientes: 0, bloqueIdSugerido: null, items: [] };
    };

    try {
      await repasoService.getPendientes(5, 20, 12);
    } finally {
      repasoRepository.getPendientes = original;
    }

    assert.deepEqual(received, [5, 20, 12]);
  });
});
