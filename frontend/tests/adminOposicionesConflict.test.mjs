import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/admin/AdminOposicionesPage.jsx', import.meta.url), 'utf8');

test('la UI administrativa muestra el detalle de accesos incompatibles', () => {
  assert.match(source, /conflictDetails\?\.accesosIncompatibles/);
  assert.match(source, /Gestionar accesos/);
  assert.match(source, /oposicion_id=/);
});
