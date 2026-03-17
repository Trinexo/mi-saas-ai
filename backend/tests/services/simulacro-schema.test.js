/**
 * Sprint 7 PR 01 — schema.sql: tabla tests ampliada para simulacros
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaSQL = readFileSync(join(__dirname, '../../..', 'database/schema.sql'), 'utf8');

describe('schema.sql — tabla tests ampliada para simulacros (Sprint 7 PR 01)', () => {
  it('tema_id en tests es nullable (sin ON DELETE CASCADE — específico de tests)', () => {
    // En preguntas y progreso_usuario tiene ON DELETE CASCADE; en tests no.
    // Si tema_id fuera NOT NULL en tests quedaría como "tema_id BIGINT NOT NULL REFERENCES temas(id),"
    // pero ahora es "tema_id BIGINT REFERENCES temas(id)," (nullable, sin NOT NULL)
    assert.ok(
      schemaSQL.includes('tema_id BIGINT REFERENCES temas(id),'),
      'tests.tema_id debe ser nullable (sin NOT NULL)',
    );
  });

  it('tiene columna oposicion_id nullable', () => {
    assert.ok(
      schemaSQL.includes('oposicion_id BIGINT REFERENCES oposiciones(id)'),
      'Debe existir oposicion_id BIGINT REFERENCES oposiciones(id)',
    );
  });

  it('tiene columna duracion_segundos INTEGER', () => {
    assert.ok(
      schemaSQL.includes('duracion_segundos INTEGER'),
      'Debe existir columna duracion_segundos',
    );
  });

  it('tiene índice idx_tests_usuario_oposicion', () => {
    assert.ok(
      schemaSQL.includes('idx_tests_usuario_oposicion'),
      'Debe existir índice para historial de simulacros',
    );
  });

  it('topic_test sigue presente en la tabla tests', () => {
    assert.ok(
      schemaSQL.includes('tipo_test TEXT NOT NULL'),
      'Debe mantener tipo_test TEXT NOT NULL',
    );
  });
});
