/**
 * Sprint 11 PR 03 — catalogAdmin schemas + repository + service exports
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createOposicionSchema,
  updateOposicionSchema,
  createMateriaSchema,
  updateMateriaSchema,
  createTemaSchema,
  updateTemaSchema,
} from '../../src/schemas/catalogAdmin.schema.js';
import { catalogAdminRepository } from '../../src/repositories/catalogAdmin.repository.js';
import { catalogAdminService } from '../../src/services/catalogAdmin.service.js';

describe('createOposicionSchema', () => {
  it('acepta nombre válido', () => {
    const r = createOposicionSchema.safeParse({ nombre: 'Auxiliar Administrativo' });
    assert.equal(r.success, true);
  });

  it('acepta nombre con descripcion', () => {
    const r = createOposicionSchema.safeParse({ nombre: 'Administrativo', descripcion: 'Cuerpo general' });
    assert.equal(r.success, true);
  });

  it('rechaza nombre vacío', () => {
    const r = createOposicionSchema.safeParse({ nombre: '' });
    assert.equal(r.success, false);
  });

  it('rechaza si falta nombre', () => {
    const r = createOposicionSchema.safeParse({});
    assert.equal(r.success, false);
  });
});

describe('updateOposicionSchema', () => {
  it('acepta solo nombre', () => {
    const r = updateOposicionSchema.safeParse({ nombre: 'Nuevo nombre' });
    assert.equal(r.success, true);
  });

  it('acepta solo descripcion', () => {
    const r = updateOposicionSchema.safeParse({ descripcion: 'Nueva descripción' });
    assert.equal(r.success, true);
  });

  it('rechaza si no se envía ningún campo', () => {
    const r = updateOposicionSchema.safeParse({});
    assert.equal(r.success, false);
  });
});

describe('createMateriaSchema', () => {
  it('acepta campos válidos', () => {
    const r = createMateriaSchema.safeParse({ oposicion_id: '1', nombre: 'Derecho Constitucional' });
    assert.equal(r.success, true);
    assert.equal(r.data.oposicion_id, 1);
  });

  it('rechaza oposicion_id cero', () => {
    const r = createMateriaSchema.safeParse({ oposicion_id: '0', nombre: 'Tema X' });
    assert.equal(r.success, false);
  });

  it('rechaza nombre de 1 carácter', () => {
    const r = createMateriaSchema.safeParse({ oposicion_id: '1', nombre: 'A' });
    assert.equal(r.success, false);
  });
});

describe('updateMateriaSchema', () => {
  it('acepta nombre válido', () => {
    const r = updateMateriaSchema.safeParse({ nombre: 'Nuevo nombre materia' });
    assert.equal(r.success, true);
  });
});

describe('createTemaSchema', () => {
  it('acepta campos válidos', () => {
    const r = createTemaSchema.safeParse({ materia_id: '3', nombre: 'Tema 1: La Constitución' });
    assert.equal(r.success, true);
    assert.equal(r.data.materia_id, 3);
  });

  it('rechaza materia_id negativo', () => {
    const r = createTemaSchema.safeParse({ materia_id: '-1', nombre: 'Tema X' });
    assert.equal(r.success, false);
  });
});

describe('updateTemaSchema', () => {
  it('acepta nombre válido', () => {
    const r = updateTemaSchema.safeParse({ nombre: 'Nuevo nombre tema' });
    assert.equal(r.success, true);
  });
});

describe('catalogAdminRepository exports', () => {
  const ops = [
    'createOposicion', 'updateOposicion', 'deleteOposicion',
    'createMateria', 'updateMateria', 'deleteMateria',
    'createTema', 'updateTema', 'deleteTema',
  ];
  for (const op of ops) {
    it(`${op} está exportado`, () => {
      assert.equal(typeof catalogAdminRepository[op], 'function');
    });
  }
});

describe('catalogAdminService exports', () => {
  const ops = [
    'createOposicion', 'updateOposicion', 'deleteOposicion',
    'createMateria', 'updateMateria', 'deleteMateria',
    'createTema', 'updateTema', 'deleteTema',
  ];
  for (const op of ops) {
    it(`${op} está exportado`, () => {
      assert.equal(typeof catalogAdminService[op], 'function');
    });
  }
});
