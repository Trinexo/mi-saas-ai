import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sql = fs.readFileSync(path.join(root, 'database/migrations/044_examenes_oficiales.sql'), 'utf8');

test('044 define el modelo oficial editorial y sus restricciones', () => {
  assert.match(sql, /CREATE TABLE IF NOT EXISTS examenes_oficiales/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS examenes_oficiales_preguntas/i);
  assert.match(sql, /anio SMALLINT NOT NULL CHECK \(anio BETWEEN 1900 AND 2200\)/i);
  assert.match(sql, /orden INTEGER CHECK \(orden IS NULL OR orden > 0\)/i);
  assert.match(sql, /WHERE orden IS NOT NULL/i);
  assert.match(sql, /ON DELETE RESTRICT/i);
  assert.match(sql, /trg_validate_examen_oficial_pregunta_oposicion/i);
  assert.match(sql, /trg_prevent_incompatible_pregunta_examen_oposicion/i);
  assert.match(sql, /trg_prevent_incompatible_examen_oposicion_update/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS oposiciones_anios_oficiales/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS preguntas_anios_oficiales/i);
  assert.match(sql, /trg_validate_pregunta_anio_oficial_oposicion/i);
  assert.match(sql, /trg_prevent_incompatible_pregunta_anio_oficial_update/i);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS oposicion_anio_id BIGINT/i);
  assert.match(sql, /fk_examenes_oficiales_oposicion_anio/i);
  assert.match(sql, /trg_validate_examen_oficial_oposicion_anio/i);
  assert.match(sql, /trg_validate_examen_oficial_pregunta_anio/i);
});

test('044 usa identidad normalizada para convocatoria NULL y mayúsculas', () => {
  assert.match(sql, /lower\(nombre\)/i);
  assert.match(sql, /coalesce\(lower\(convocatoria\), ''\)/i);
});
