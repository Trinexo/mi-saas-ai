import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { patchOposicionPreferida } from '../../src/controllers/auth.controller.js';
import { patchOposicionPreferidaSchema } from '../../src/schemas/auth.schema.js';

describe('patchOposicionPreferida controller', () => {
  it('should export patchOposicionPreferida as a function', () => {
    assert.strictEqual(typeof patchOposicionPreferida, 'function');
  });
});

describe('patchOposicionPreferidaSchema', () => {
  it('should accept a positive integer', () => {
    const result = patchOposicionPreferidaSchema.safeParse({ oposicionPreferidaId: 3 });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.oposicionPreferidaId, 3);
  });

  it('should accept null', () => {
    const result = patchOposicionPreferidaSchema.safeParse({ oposicionPreferidaId: null });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.oposicionPreferidaId, null);
  });

  it('should reject a negative number', () => {
    const result = patchOposicionPreferidaSchema.safeParse({ oposicionPreferidaId: -1 });
    assert.strictEqual(result.success, false);
  });

  it('should reject zero', () => {
    const result = patchOposicionPreferidaSchema.safeParse({ oposicionPreferidaId: 0 });
    assert.strictEqual(result.success, false);
  });
});
