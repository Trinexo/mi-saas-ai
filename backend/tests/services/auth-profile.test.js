/**
 * Sprint 8 PR 01 — auth schemas + service + repository exports
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { updateProfileSchema, updatePasswordSchema } from '../../src/schemas/auth.schema.js';
import { authRepository } from '../../src/repositories/auth.repository.js';
import { authService } from '../../src/services/auth.service.js';

describe('updateProfileSchema', () => {
  it('acepta nombre válido', () => {
    const r = updateProfileSchema.safeParse({ nombre: 'Ana' });
    assert.equal(r.success, true);
  });

  it('acepta email válido', () => {
    const r = updateProfileSchema.safeParse({ email: 'a@b.com' });
    assert.equal(r.success, true);
  });

  it('acepta oposicionPreferidaId null', () => {
    const r = updateProfileSchema.safeParse({ oposicionPreferidaId: null });
    assert.equal(r.success, true);
  });

  it('acepta oposicionPreferidaId numérico como string', () => {
    const r = updateProfileSchema.safeParse({ oposicionPreferidaId: '3' });
    assert.equal(r.success, true);
    assert.equal(r.data.oposicionPreferidaId, 3);
  });

  it('rechaza objeto vacío', () => {
    const r = updateProfileSchema.safeParse({});
    assert.equal(r.success, false);
  });

  it('rechaza nombre demasiado corto', () => {
    const r = updateProfileSchema.safeParse({ nombre: 'A' });
    assert.equal(r.success, false);
  });
});

describe('updatePasswordSchema', () => {
  it('acepta payload válido', () => {
    const r = updatePasswordSchema.safeParse({ passwordActual: 'vieja123', passwordNuevo: 'nueva456' });
    assert.equal(r.success, true);
  });

  it('rechaza passwordNuevo menor de 8 caracteres', () => {
    const r = updatePasswordSchema.safeParse({ passwordActual: 'vieja', passwordNuevo: 'corta' });
    assert.equal(r.success, false);
  });

  it('rechaza sin passwordActual', () => {
    const r = updatePasswordSchema.safeParse({ passwordNuevo: 'nueva1234' });
    assert.equal(r.success, false);
  });
});

describe('authRepository — nuevos métodos', () => {
  it('getUserById está exportado', () => {
    assert.equal(typeof authRepository.getUserById, 'function');
  });

  it('updateProfile está exportado', () => {
    assert.equal(typeof authRepository.updateProfile, 'function');
  });

  it('getPasswordHash está exportado', () => {
    assert.equal(typeof authRepository.getPasswordHash, 'function');
  });

  it('updatePasswordHash está exportado', () => {
    assert.equal(typeof authRepository.updatePasswordHash, 'function');
  });
});

describe('authService — nuevos métodos', () => {
  it('getMe está exportado', () => {
    assert.equal(typeof authService.getMe, 'function');
  });

  it('updateProfile está exportado', () => {
    assert.equal(typeof authService.updateProfile, 'function');
  });

  it('updatePassword está exportado', () => {
    assert.equal(typeof authService.updatePassword, 'function');
  });
});
