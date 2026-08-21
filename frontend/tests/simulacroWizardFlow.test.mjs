import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/admin/AdminSimulacroWizardPage.jsx', import.meta.url), 'utf8');

test('el wizard normal mantiene cuatro pasos y reserva Estructura al flujo legacy', () => {
  const normal = source.match(/const PASOS = \[(.*?)\n\];/s)?.[1] ?? '';
  assert.deepEqual([...normal.matchAll(/id: (\d+), label:/g)].map(([, id]) => Number(id)), [1, 2, 3, 4]);
  assert.match(source, /PASOS\[0\]\.label\s*=\s*'Información'/);
  assert.match(source, /PASOS\[2\]\.label\s*=\s*'Configuración'/);
  assert.match(source, /PASOS\[3\]\.label\s*=\s*'Publicación'/);
  assert.doesNotMatch(normal, /Estructura/);
  assert.match(source, /const PASOS_LEGACY = \[/);
  assert.match(source, /\{ id: 2, label: 'Estructura' \}/);
});

test('la selección de preguntas permanece en el paso 2 y exige N/N para continuar', () => {
  assert.match(source, /<strong>Preguntas seleccionadas:/);
  assert.match(source, /Selecciona exactamente \$\{form\.total_preguntas\} preguntas/);
  assert.match(source, /paso === 2 && \(!simulacroId \|\| .*preguntas \?\? \[\]\)\.length !== Number\(form\.total_preguntas\)/);
  assert.match(source, /setPaso\(creatingQuestionsBlock \? 2 : 3\)/);
});

test('el paso 3 normal renderiza la configuración general', () => {
  assert.match(source, /: <Paso4 form=\{form\} set=\{set\} \/>\)/);
  assert.match(source, /!modoLegacy && paso === 4 && <Paso5/);
});

test('usa exclusivamente el estado de exámenes múltiples y no el setter singular', () => {
  assert.doesNotMatch(source, /setSelectedExamId\b/);
  assert.doesNotMatch(source, /selectedExamId\b/);
  assert.match(source, /setSelectedExamIds/);
  assert.match(source, /form\.examen_ids/);
});

test('gestionar preguntas se habilita con configuración mínima y no depende de Siguiente', () => {
  assert.match(source, /configuracionMinimaValida = Boolean\(/);
  assert.match(source, /onEnsurePersisted/);
  assert.match(source, /type="button"[^>]*disabled=\{!configuracionMinimaValida/);
  assert.match(source, /setModalOpen\(true\)/);
});
