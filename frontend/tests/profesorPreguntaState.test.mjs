import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/profesor/ProfesorPreguntasPage.jsx', import.meta.url), 'utf8');

test('la edicion del profesor incluye el selector de estado editorial', () => {
  assert.match(source, /Estado editorial/);
  assert.match(source, /value=\{editForm\.estado\}/);
  assert.match(source, /value="aprobada"/);
  assert.match(source, /value="revision"/);
  assert.match(source, /value="cancelada"/);
  assert.match(source, /estado: data\.estado/);
});

test('la tabla usa las etiquetas del estado editorial vigente', () => {
  assert.match(source, />Estado<\/th>/);
  assert.match(source, /aprobada: 'Aprobada'/);
  assert.match(source, /revision: 'En revisi.n'/);
  assert.match(source, /cancelada: 'Cancelada'/);
  assert.doesNotMatch(source, /aprobada: 'Correcta'/);
  assert.doesNotMatch(source, /revision: 'Revisar'/);
});

test('la problemática se representa desde motivos del backend y permanece separada del estado editorial', () => {
  assert.match(source, /<th style=\{TH\}>Problemática<\/th>/);
  assert.match(source, /Sin alertas/);
  assert.match(source, /<ProblematicReasons item=\{problematica\} \/>/);
  assert.match(source, /motivos\.includes\('reportes_abiertos'\)/);
  assert.match(source, /motivos\.includes\('tasa_fallo'\)/);
  assert.match(source, /motivos\.includes\('tasa_blancos'\)/);
  assert.doesNotMatch(source, /intentos\s*[>=].*60/);
});
