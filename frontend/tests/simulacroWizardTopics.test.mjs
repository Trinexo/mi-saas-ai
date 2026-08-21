import test from 'node:test';
import assert from 'node:assert/strict';
import { getWizardTopicsView, normalizeWizardTopics } from '../src/pages/admin/simulacroWizardTopics.js';

test('normaliza varios temas y muestra el dropdown', () => {
  const topics = normalizeWizardTopics({ items: [{ id: '1', nombre: 'Tema 1' }, { tema_id: '2', tema_nombre: 'Tema 2' }] }, true);
  assert.deepEqual(topics, [
    { tema_id: '1', tema_nombre: 'Tema 1' },
    { tema_id: '2', tema_nombre: 'Tema 2' },
  ]);
  assert.equal(getWizardTopicsView({ oposicionId: '10', topics }), 'multi-tema');
});

test('un único tema se muestra como contexto legible', () => {
  const topics = normalizeWizardTopics([{ id: 1, nombre: 'Constitución' }], false);
  assert.equal(getWizardTopicsView({ oposicionId: '10', topics }), 'un-tema');
});

test('oposición sin temas muestra estado vacío y sin oposición queda deshabilitado', () => {
  assert.equal(getWizardTopicsView({ oposicionId: '10', topics: [] }), 'sin-temas');
  assert.equal(getWizardTopicsView({ oposicionId: '', topics: [] }), 'sin-oposicion');
});

test('cambiar oposición vuelve a normalizar sus opciones', () => {
  const first = normalizeWizardTopics([{ id: '1', nombre: 'Tema A' }], false);
  const second = normalizeWizardTopics({ items: [{ id: '2', nombre: 'Tema B' }, { id: '3', nombre: 'Tema C' }] }, true);
  assert.deepEqual(first.map((topic) => topic.tema_id), ['1']);
  assert.deepEqual(second.map((topic) => topic.tema_id), ['2', '3']);
});
