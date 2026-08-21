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
const professorQuestions = readFileSync(
  new URL('../src/pages/profesor/ProfesorPreguntasPage.jsx', import.meta.url),
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

test('la edición del profesor integra imagen y audio mediante sus rutas propias', () => {
  assert.match(professorQuestions, /<AudioRecorder/);
  assert.match(professorQuestions, /<MediaBrowserModal/);
  assert.match(professorQuestions, /<AudioBrowserModal/);
  assert.match(professorQuestions, /profesorApi\.uploadImagenPregunta/);
  assert.match(professorQuestions, /profesorApi\.deleteImagenPregunta/);
  assert.match(professorQuestions, /profesorApi\.uploadAudioPregunta/);
  assert.match(professorQuestions, /profesorApi\.deleteAudioPregunta/);
});

test('la edición del profesor conserva metadata oficial múltiple', () => {
  assert.match(professorQuestions, /<OfficialYearsSelector/);
  assert.match(professorQuestions, /<OfficialExamsSelector/);
  assert.match(professorQuestions, /anioIds: official \? officialYearIds : \[\]/);
  assert.match(professorQuestions, /examenIds: official \? officialExamIds : \[\]/);
  assert.match(professorQuestions, /setOfficialExamIds\(\[\]\)/);
});
