import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../src/pages/HomePage.jsx', import.meta.url), 'utf8');
const result = readFileSync(new URL('../src/pages/ResultPage.jsx', import.meta.url), 'utf8');

test('Home Albacer representa el estado individual entregado por backend', () => {
  assert.match(home, /item\.estado === 'passed'/);
  assert.match(home, /item\.estado === 'locked'/);
  assert.match(home, /final\.estado === 'passed'/);
  assert.doesNotMatch(home, /status: done \? 'done' : active \? 'active' : 'locked',\s*\n\s*item,/);
});

test('el resultado visual mantiene el mismo umbral de nota 5 que D-006', () => {
  assert.match(result, /Number\(result\?\.nota \?\? 0\) >= 5/);
});
