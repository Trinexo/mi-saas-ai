import test from 'node:test';
import assert from 'node:assert/strict';
import { createExamSchema, attachExamQuestionsSchema, questionExamsSchema } from '../../src/schemas/examenesOficiales.schema.js';
import { appendOfficialQuestionFilter } from '../../src/repositories/questionOfficialFilter.js';

test('examen oficial valida año y conserva IDs como texto', () => {
  const parsed = createExamSchema.parse({ oposicionId: '9223372036854775807', nombre: 'Policía', anio: 2024 });
  assert.equal(parsed.oposicionId, '9223372036854775807');
  assert.throws(() => createExamSchema.parse({ oposicionId: '1', nombre: 'x', anio: 1800 }));
});

test('relación oficial acepta orden NULL y rechaza IDs no positivos', () => {
  assert.deepEqual(attachExamQuestionsSchema.parse({ preguntaIds: ['10', '11'], ordenes: [null, 2] }).ordenes, [null, 2]);
  assert.throws(() => attachExamQuestionsSchema.parse({ preguntaIds: ['0'] }));
  assert.equal(attachExamQuestionsSchema.parse({ preguntaIds: [9223372036854775807n.toString()] }).preguntaIds[0], '9223372036854775807');
  assert.throws(() => attachExamQuestionsSchema.parse({ preguntaIds: ['9223372036854775808'] }));
});

test('las asociaciones de pregunta conservan IDs BIGINT como texto', () => {
  assert.deepEqual(questionExamsSchema.parse({ examenIds: ['9223372036854775807'] }).examenIds, ['9223372036854775807']);
  assert.throws(() => questionExamsSchema.parse({ examenIds: ['9223372036854775808'] }));
});

test('el filtro oficial acepta varios IDs de año sin duplicar preguntas', () => {
  const params = ['tema', 10];
  const sql = appendOfficialQuestionFilter({ officialidad: 'official', anioIds: ['20', '21'] }, params, 3);
  assert.match(sql, /pao\.oposicion_anio_id = ANY\(\$3::bigint\[\]\)/);
  assert.deepEqual(params, ['tema', 10, ['20', '21']]);
  assert.doesNotMatch(sql, /JOIN examenes_oficiales/);
});
