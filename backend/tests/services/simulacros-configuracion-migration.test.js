import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfiguredExamIds } from '../../src/services/adminSimulacros.service.js';
import { adminSimulacrosService } from '../../src/services/adminSimulacros.service.js';
import { configuredExamMatchSql } from '../../src/repositories/adminSimulacros.repository.js';
import { adminSimulacrosRepository } from '../../src/repositories/adminSimulacros.repository.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.resolve(here, '../../../database/migrations/046_simulacros_configuracion_preguntas.sql');
const repairMigrationPath = path.resolve(here, '../../../database/migrations/047_simulacros_configuracion_examenes.sql');
const repositoryPath = path.resolve(here, '../../src/repositories/adminSimulacros.repository.js');

test('046 crea la configuracion persistente del wizard sin alterar tablas legacy', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS simulacros_configuracion_preguntas/i);
  assert.match(sql, /total_preguntas INTEGER NOT NULL CHECK \(total_preguntas > 0\)/i);
  assert.match(sql, /officialidad TEXT NOT NULL DEFAULT 'all'/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS simulacros_configuracion_temas/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS simulacros_configuracion_anios/i);
  assert.doesNotMatch(sql, /simulacros_configuracion_examenes/i);
  assert.doesNotMatch(sql, /ALTER TABLE\s+simulacros\s+DROP/i);
});

test('047 completa de forma idempotente la relación de múltiples exámenes', () => {
  const sql = fs.readFileSync(repairMigrationPath, 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS simulacros_configuracion_examenes/i);
  assert.match(sql, /PRIMARY KEY \(simulacro_id, examen_id\)/i);
  assert.match(sql, /REFERENCES simulacros_configuracion_preguntas\(simulacro_id\)\s+ON DELETE CASCADE/i);
  assert.match(sql, /REFERENCES examenes_oficiales\(id\)\s+ON DELETE RESTRICT/i);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS idx_sim_config_examenes_examen/i);
});

test('la configuracion multiple tiene prioridad sobre examen_id legacy', () => {
  assert.deepEqual(resolveConfiguredExamIds({ examen_id: 10, examen_ids: [] }), ['10']);
  assert.deepEqual(resolveConfiguredExamIds({ examen_id: 10, examen_ids: [10, 20, 30] }), ['10', '20', '30']);
  assert.deepEqual(resolveConfiguredExamIds({ examen_id: null, examen_ids: [10, 20] }), ['10', '20']);
  assert.deepEqual(resolveConfiguredExamIds({ examen_id: null, examen_ids: [] }), []);
  assert.deepEqual(resolveConfiguredExamIds({ examen_id: 10, examen_ids: [20, 30, 30] }), ['20', '30']);
});

test('la consulta aplica fallback legacy solo cuando no hay filas multiples', () => {
  const sql = configuredExamMatchSql();
  assert.match(sql, /CASE WHEN EXISTS/i);
  assert.match(sql, /simulacros_configuracion_examenes ce0/i);
  assert.match(sql, /THEN EXISTS/i);
  assert.match(sql, /c\.examen_id IS NULL OR EXISTS/i);
});

test('la edicion reemplaza el conjunto multiple anterior', () => {
  const sql = fs.readFileSync(repositoryPath, 'utf8');
  assert.match(sql, /DELETE FROM simulacros_configuracion_examenes/i);
  assert.match(sql, /INSERT INTO simulacros_configuracion_examenes/i);
  assert.match(sql, /ON CONFLICT DO NOTHING/i);
});

test('la lectura devuelve todos los examenes multiples y conserva fallback legacy', () => {
  const sql = fs.readFileSync(repositoryPath, 'utf8');
  assert.match(sql, /json_agg\(e\.examen_id::text ORDER BY e\.examen_id\)/i);
  assert.match(sql, /CASE WHEN c\.examen_id IS NULL THEN '\[\]'::json ELSE json_build_array\(c\.examen_id::text\) END/i);
});

test('la configuracion oficial valida oposicion y compatibilidad año-examen', async () => {
  const original = adminSimulacrosRepository.getOfficialFilterScope;
  try {
    adminSimulacrosRepository.getOfficialFilterScope = async () => ({
      years: [{ id: '20', oposicion_id: '8', anio: 2024 }],
      exams: [{ id: '30', oposicion_id: '8', oposicion_anio_id: '20', anio: 2024 }],
    });
    await assert.doesNotReject(() => adminSimulacrosService.assertConfigOfficialFilters({
      officialidad: 'official', anio_ids: ['20'], examen_ids: ['30'],
    }, '8'));

    adminSimulacrosRepository.getOfficialFilterScope = async () => ({
      years: [{ id: '20', oposicion_id: '8', anio: 2024 }],
      exams: [{ id: '31', oposicion_id: '8', oposicion_anio_id: '21', anio: 2025 }],
    });
    await assert.rejects(
      () => adminSimulacrosService.assertConfigOfficialFilters({
        officialidad: 'official', anio_ids: ['20'], examen_ids: ['31'],
      }, '8'),
      /años seleccionados/,
    );
  } finally {
    adminSimulacrosRepository.getOfficialFilterScope = original;
  }
});
