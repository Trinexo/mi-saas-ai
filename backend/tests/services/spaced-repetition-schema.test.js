import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaSQL = readFileSync(join(__dirname, '../../..', 'database/schema.sql'), 'utf8');

describe('schema.sql — tabla repeticion_espaciada (Sprint 6 PR 01)', () => {
  it('define la tabla repeticion_espaciada', () => {
    assert.ok(
      schemaSQL.includes('CREATE TABLE IF NOT EXISTS repeticion_espaciada'),
      'Debe existir CREATE TABLE repeticion_espaciada',
    );
  });

  it('tiene columna nivel_memoria SMALLINT', () => {
    assert.ok(schemaSQL.includes('nivel_memoria SMALLINT'), 'Debe tener nivel_memoria SMALLINT');
  });

  it('tiene columna proxima_revision TIMESTAMP', () => {
    assert.ok(schemaSQL.includes('proxima_revision TIMESTAMP'), 'Debe tener proxima_revision TIMESTAMP');
  });

  it('tiene UNIQUE (usuario_id, pregunta_id)', () => {
    assert.ok(schemaSQL.includes('UNIQUE (usuario_id, pregunta_id)'), 'Debe tener constraint UNIQUE');
  });

  it('tiene índice idx_repaso_usuario_proxima', () => {
    assert.ok(schemaSQL.includes('idx_repaso_usuario_proxima'), 'Debe tener el índice principal de repaso');
  });

  it('tiene índice idx_repaso_pregunta', () => {
    assert.ok(schemaSQL.includes('idx_repaso_pregunta'), 'Debe tener el índice de pregunta_id');
  });
});
