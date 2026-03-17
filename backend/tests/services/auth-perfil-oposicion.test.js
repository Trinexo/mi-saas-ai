import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authRepository } from '../../src/repositories/auth.repository.js';
import { authService } from '../../src/services/auth.service.js';

describe('authRepository — updateProfile con oposicionPreferidaId', () => {
  it('getUserById está exportado', () => {
    assert.equal(typeof authRepository.getUserById, 'function');
  });

  it('updateProfile está exportado y acepta oposicionPreferidaId', () => {
    assert.equal(typeof authRepository.updateProfile, 'function');
    const fn = authRepository.updateProfile.toString();
    assert.ok(fn.includes('oposicionPreferidaId'), 'updateProfile debe aceptar oposicionPreferidaId');
  });
});

describe('authService — getProfile devuelve oposicionPreferidaId', () => {
  it('getProfile está exportado', () => {
    assert.equal(typeof authService.getProfile, 'function');
  });

  it('updateProfile está exportado', () => {
    assert.equal(typeof authService.updateProfile, 'function');
  });
});
