/**
 * Sprint 10 PR 03 — getDashboard en statsRepository + statsService
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { statsRepository } from '../../src/repositories/stats.repository.js';
import { statsService } from '../../src/services/stats.service.js';

describe('statsRepository — getDashboard', () => {
  it('getDashboard está exportado', () => {
    assert.equal(typeof statsRepository.getDashboard, 'function');
  });
});

describe('statsService — getDashboard', () => {
  it('getDashboard está exportado', () => {
    assert.equal(typeof statsService.getDashboard, 'function');
  });
});
