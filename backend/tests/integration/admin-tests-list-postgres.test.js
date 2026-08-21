import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { adminTestsRepository } from '../../src/repositories/adminTests.repository.js';

const marker = 'qa_admin_tests_list_42803';
const databaseUrl = new URL(process.env.DATABASE_URL ?? 'postgres://invalid');
const enabled = ['127.0.0.1', 'localhost', '::1'].includes(databaseUrl.hostname)
  && /test|qa|recovery/i.test(databaseUrl.pathname);

async function cleanup() {
  await pool.query('DELETE FROM admin_tests WHERE nombre LIKE $1', [`${marker}%`]);
  await pool.query('DELETE FROM preguntas WHERE enunciado LIKE $1', [`${marker}%`]);
  await pool.query('DELETE FROM oposiciones WHERE slug = $1', [marker]);
}

test('listTests mantiene una fila por test con cero, uno o varios temas', { skip: !enabled }, async () => {
  await cleanup();
  try {
    const opposition = (await pool.query(
      `INSERT INTO oposiciones (nombre, slug, estado)
       VALUES ($1, $2, 'activa') RETURNING id`,
      [marker, marker],
    )).rows[0];
    const themes = (await pool.query(
      `INSERT INTO temas (oposicion_id, nombre)
       VALUES ($1, $2), ($1, $3) RETURNING id`,
      [opposition.id, `${marker}_tema_a`, `${marker}_tema_b`],
    )).rows;
    const questions = [];
    for (const [index, theme] of themes.entries()) {
      questions.push((await pool.query(
        `INSERT INTO preguntas (tema_id, enunciado, explicacion, nivel_dificultad, estado)
         VALUES ($1, $2, $3, 'media', 'aprobada') RETURNING id`,
        [theme.id, `${marker}_pregunta_${index}`, `${marker}_explicacion_${index}`],
      )).rows[0]);
    }
    const tests = {};
    for (const key of ['sin_temas', 'un_tema', 'varios_temas']) {
      tests[key] = (await pool.query(
        `INSERT INTO admin_tests (nombre, estado, scope, oposicion_id)
         VALUES ($1, 'borrador', 'experto', $2) RETURNING id`,
        [`${marker}_${key}`, key === 'sin_temas' ? opposition.id : null],
      )).rows[0];
    }
    await pool.query(
      `INSERT INTO admin_tests_temas (test_id, tema_id)
       VALUES ($1, $3), ($2, $3), ($2, $4)`,
      [tests.un_tema.id, tests.varios_temas.id, themes[0].id, themes[1].id],
    );
    await pool.query(
      `INSERT INTO admin_tests_preguntas (test_id, pregunta_id, orden)
       VALUES ($1, $3, 1), ($2, $3, 1), ($2, $4, 2)`,
      [tests.un_tema.id, tests.varios_temas.id, questions[0].id, questions[1].id],
    );

    const result = await adminTestsRepository.listTests({
      q: marker,
      estado: null,
      scope: null,
      oposicionId: null,
      allowedOposicionIds: null,
      limit: 20,
      offset: 0,
    });

    assert.equal(result.total, 3);
    assert.equal(result.items.length, 3);
    assert.equal(new Set(result.items.map((item) => String(item.id))).size, 3);
    const byName = Object.fromEntries(result.items.map((item) => [item.nombre, item]));
    assert.equal(byName[`${marker}_sin_temas`].total_preguntas, 0);
    assert.equal(byName[`${marker}_un_tema`].total_preguntas, 1);
    assert.equal(byName[`${marker}_varios_temas`].total_preguntas, 2);
    for (const item of result.items) {
      assert.equal(String(item.resolved_oposicion_id), String(opposition.id));
    }
    assert.equal(byName[`${marker}_un_tema`].tema_ids.length, 1);
    assert.equal(byName[`${marker}_varios_temas`].tema_ids.length, 2);
  } finally {
    await cleanup();
    await pool.end();
  }
});
