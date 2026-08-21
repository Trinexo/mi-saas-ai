import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const adminQuestions = readFileSync(
  new URL('../src/pages/admin/AdminQuestionsPage.jsx', import.meta.url),
  'utf8',
);
const albacerModules = readFileSync(
  new URL('../src/pages/albacer/AlbacerModulosPage.jsx', import.meta.url),
  'utf8',
);

test('la edición admin carga bloques mediante el setter existente', () => {
  assert.match(adminQuestions, /setCatBloques\(bls\)/);
  assert.doesNotMatch(adminQuestions, /setFormBloques\(/);
});

test('módulos Albacer respeta el máximo del catálogo de oposiciones', () => {
  assert.match(
    albacerModules,
    /listOposicionesConStats\(token, \{ page_size: 100 \}\)/,
  );
  assert.doesNotMatch(
    albacerModules,
    /listOposicionesConStats\(token, \{ page_size: 200 \}\)/,
  );
});
