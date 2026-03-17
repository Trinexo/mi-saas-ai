import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { repasoPendientesQuerySchema } from '../../src/schemas/repaso.schema.js';
import { repasoRepository } from '../../src/repositories/repaso.repository.js';
import { repasoService } from '../../src/services/repaso.service.js';

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

  it('rechaza limit fuera de rango', () => {
    const r = repasoPendientesQuerySchema.safeParse({ limit: '0' });
    assert.equal(r.success, false);
  });
});

describe('repasoRepository', () => {
  it('getPendientes está exportado', () => {
    assert.equal(typeof repasoRepository.getPendientes, 'function');
  });
});

describe('repasoService', () => {
  it('getPendientes está exportado', () => {
    assert.equal(typeof repasoService.getPendientes, 'function');
  });
});
