import test from 'node:test';
import assert from 'node:assert/strict';
import { adminPreguntasImportCsvService } from '../../src/services/adminPreguntasImportCsv.service.js';
import { createPreguntaSchema } from '../../src/schemas/admin.schema.js';

test('import CSV mapper exige prefijo asterisco para marcar la correcta', () => {
  const csv = [
    'tema_id,enunciado,opcion_1,opcion_2,opcion_3,opcion_4,opcion_correcta,explicacion',
    '2,Pregunta importacion suficientemente larga,A,B,C,D,2,Explicacion',
  ].join('\n');
  const { delimiter, lines, indexes } = adminPreguntasImportCsvService.parseCsvPayload({ csv, delimiter: ',' });
  const values = adminPreguntasImportCsvService.parseRow(lines[1], delimiter);

  assert.throws(
    () => adminPreguntasImportCsvService.buildItem(values, indexes),
    /prefijo \*/,
  );
});

test('import CSV mapper acepta una única opción con prefijo asterisco', () => {
  const csv = [
    'tema_id,enunciado,opcion_1,opcion_2,opcion_3,opcion_4,opcion_correcta,explicacion',
    '2,Pregunta importacion suficientemente larga,*A,B,C,D,2,Explicacion',
  ].join('\n');
  const { delimiter, lines, indexes } = adminPreguntasImportCsvService.parseCsvPayload({ csv, delimiter: ',' });
  const values = adminPreguntasImportCsvService.parseRow(lines[1], delimiter);

  const item = adminPreguntasImportCsvService.buildItem(values, indexes);

  assert.equal(item.opciones[0].correcta, true);
  assert.equal(item.opciones[1].correcta, false);
  assert.equal(item.opciones[2].correcta, false);
  assert.equal(item.opciones[3].correcta, false);
});

test('import CSV mapper omite opcion_4 vacia y acepta tres opciones', () => {
  const csv = [
    'tema_id;enunciado;opcion_1;opcion_2;opcion_3;opcion_4;explicacion',
    '38;Pregunta importacion suficientemente larga;A;B;*C;;Explicacion',
  ].join('\n');
  const { delimiter, lines, indexes } = adminPreguntasImportCsvService.parseCsvPayload({ csv, delimiter: ';' });
  const values = adminPreguntasImportCsvService.parseRow(lines[1], delimiter);

  const item = adminPreguntasImportCsvService.buildItem(values, indexes);
  const parsed = createPreguntaSchema.safeParse(item);

  assert.equal(item.opciones.length, 3);
  assert.equal(item.opciones[2].correcta, true);
  assert.equal(parsed.success, true);
});

test('import CSV mapper acepta CSV sin columnas opcion_3 y opcion_4', () => {
  const csv = [
    'tema_id,enunciado,opcion_1,opcion_2,explicacion',
    '38,Pregunta importacion suficientemente larga,*Verdadero,Falso,Explicacion',
  ].join('\n');
  const { delimiter, lines, indexes } = adminPreguntasImportCsvService.parseCsvPayload({ csv, delimiter: ',' });
  const values = adminPreguntasImportCsvService.parseRow(lines[1], delimiter);

  const item = adminPreguntasImportCsvService.buildItem(values, indexes);
  const parsed = createPreguntaSchema.safeParse(item);

  assert.equal(item.opciones.length, 2);
  assert.equal(parsed.success, true);
});
