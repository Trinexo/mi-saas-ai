import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBloqueSchema,
  createTemaSchema,
  listOposicionesQuerySchema,
} from '../../src/schemas/catalogAdmin.schema.js';

test('listOposicionesQuerySchema normaliza filtros paginados', () => {
  const result = listOposicionesQuerySchema.parse({
    q: 'policia',
    estado: 'activa',
    categoria: 'estado',
    page: '2',
    page_size: '50',
  });

  assert.equal(result.q, 'policia');
  assert.equal(result.estado, 'activa');
  assert.equal(result.categoria, 'estado');
  assert.equal(result.page, 2);
  assert.equal(result.page_size, 50);
});

test('schemas de temas y bloques normalizan ids', () => {
  const tema = createTemaSchema.parse({ oposicion_id: '10', nombre: 'Tema 01' });
  const bloque = createBloqueSchema.parse({ tema_id: '20', nombre: 'Bloque 01' });

  assert.equal(tema.oposicion_id, 10);
  assert.equal(bloque.tema_id, 20);
});

test('schemas de catalogo admin rechazan valores invalidos', () => {
  assert.equal(listOposicionesQuerySchema.safeParse({ page_size: '500' }).success, false);
  assert.equal(listOposicionesQuerySchema.safeParse({ estado: 'publicado' }).success, false);
  assert.equal(createTemaSchema.safeParse({ oposicion_id: 'abc', nombre: 'Tema 01' }).success, false);
  assert.equal(createBloqueSchema.safeParse({ tema_id: '0', nombre: 'Bloque 01' }).success, false);
});
