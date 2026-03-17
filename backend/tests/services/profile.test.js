/**
 * Sprint 9 PR 03 — updateProfileSchema + changePasswordSchema + authRepository + authService exportados
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { updateProfileSchema, changePasswordSchema } from '../../src/schemas/auth.schema.js';
import { authRepository } from '../../src/repositories/auth.repository.js';
import { authService } from '../../src/services/auth.service.js';

describe('updateProfileSchema', () => {
  it('acepta solo nombre', () => {
    const r = updateProfileSchema.safeParse({ nombre: 'Ana García' });
    assert.equal(r.success, true);
  });

  it('acepta solo email', () => {
    const r = updateProfileSchema.safeParse({ email: 'ana@test.com' });
    assert.equal(r.success, true);
  });

  it('acepta nombre y email juntos', () => {
    const r = updateProfileSchema.safeParse({ nombre: 'Ana', email: 'ana@test.com' });
    assert.equal(r.success, true);
  });

  it('rechaza objeto vacío (necesita al menos uno)', () => {
    const r = updateProfileSchema.safeParse({});
    assert.equal(r.success, false);
  });

  it('rechaza email inválido', () => {
    const r = updateProfileSchema.safeParse({ email: 'no-es-email' });
    assert.equal(r.success, false);
  });

  it('rechaza nombre menor de 2 caracteres', () => {
    const r = updateProfileSchema.safeParse({ nombre: 'A' });
    assert.equal(r.success, false);
  });
});

describe('changePasswordSchema', () => {
  it('acepta passwordActual y passwordNuevo válidos', () => {
    const r = changePasswordSchema.safeParse({ passwordActual: 'actual123', passwordNuevo: 'nueva12345' });
    assert.equal(r.success, true);
  });

  it('rechaza si falta passwordActual', () => {
    const r = changePasswordSchema.safeParse({ passwordNuevo: 'nueva12345' });
    assert.equal(r.success, false);
  });

  it('rechaza passwordNuevo menor de 8 caracteres', () => {
    const r = changePasswordSchema.safeParse({ passwordActual: 'actual123', passwordNuevo: 'corta' });
    assert.equal(r.success, false);
  });
});

describe('authRepository — profile methods', () => {
  it('getUserById está exportado', () => {
    assert.equal(typeof authRepository.getUserById, 'function');
  });

  it('updateProfile está exportado', () => {
    assert.equal(typeof authRepository.updateProfile, 'function');
  });

  it('updatePassword está exportado', () => {
    assert.equal(typeof authRepository.updatePassword, 'function');
  });
});

describe('authService — profile methods', () => {
  it('getProfile está exportado', () => {
    assert.equal(typeof authService.getProfile, 'function');
  });

  it('updateProfile está exportado', () => {
    assert.equal(typeof authService.updateProfile, 'function');
  });

  it('changePassword está exportado', () => {
    assert.equal(typeof authService.changePassword, 'function');
  });
});
