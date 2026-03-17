import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { historyQuerySchema } from '../../src/schemas/test.schema.js';
import { testRepository } from '../../src/repositories/test.repository.js';
import { testService } from '../../src/services/test.service.js';

describe('historyQuerySchema', () => {
  it('usa default limit=20 si no se envía query', () => {
    const r = historyQuerySchema.safeParse({});
    assert.equal(r.success, true);
    assert.equal(r.data.limit, 20);
  });

  it('coacciona limit string a number', () => {
    const r = historyQuerySchema.safeParse({ limit: '30' });
    assert.equal(r.success, true);
    assert.equal(r.data.limit, 30);
  });

  it('rechaza limit < 1', () => {
    const r = historyQuerySchema.safeParse({ limit: '0' });
    assert.equal(r.success, false);
  });

  it('rechaza limit > 100', () => {
    const r = historyQuerySchema.safeParse({ limit: '101' });
    assert.equal(r.success, false);
  });
});

describe('testRepository', () => {
  it('getUserHistory está exportado', () => {
    assert.equal(typeof testRepository.getUserHistory, 'function');
  });
});

describe('testService', () => {
  it('getHistory está exportado', () => {
    assert.equal(typeof testService.getHistory, 'function');
  });

  it('getConfig está exportado', () => {
    assert.equal(typeof testService.getConfig, 'function');
  });
});
