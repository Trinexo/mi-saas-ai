import test from 'node:test';
import assert from 'node:assert/strict';
import { fisherYates, orderOptions } from '../../src/utils/test-option-order.js';

test('fisherYates conserva todos los elementos sin duplicarlos', () => {
  const result = fisherYates(['51', '52', '53', '54'], () => 0.75);
  assert.deepEqual([...result].sort(), ['51', '52', '53', '54']);
});

test('fisherYates permite verificar órdenes distintos con un RNG inyectado', () => {
  assert.notDeepEqual(fisherYates(['1', '2', '3', '4'], () => 0), fisherYates(['1', '2', '3', '4'], () => 0.999999));
});

test('orderOptions conserva IDs reales y no depende de la posición', () => {
  const options = [{ id: 51, texto: 'A' }, { id: 52, texto: 'B' }, { id: 53, texto: 'C' }];
  assert.deepEqual(orderOptions(options, ['53', '51', '52']).map((item) => item.id), [53, 51, 52]);
});

test('orderOptions mantiene el orden recibido cuando no hay snapshot', () => {
  assert.deepEqual(orderOptions([{ id: 2 }, { id: 1 }]).map((item) => item.id), [2, 1]);
});

test('orderOptions conserva IDs BIGINT como texto sin convertirlos a Number', () => {
  const largeA = '9007199254740993';
  const largeB = '9007199254740995';
  const options = [{ id: largeA, texto: 'A' }, { id: largeB, texto: 'B' }];
  assert.deepEqual(orderOptions(options, [largeB, largeA]).map((item) => item.id), [largeB, largeA]);
});
