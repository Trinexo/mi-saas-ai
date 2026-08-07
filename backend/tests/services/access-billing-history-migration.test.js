import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../../../database/migrations/041_billing_system_history.sql', import.meta.url), 'utf8');

test('041 conserva la FK y valida el actor Stripe de sistema', () => {
  assert.match(migration, /fn_validate_access_history_system_actor/);
  assert.match(migration, /trg_validate_access_history_system_actor/);
  assert.match(migration, /actor_usuario_id IS NULL/);
  assert.match(migration, /tipoActor/);
  assert.match(migration, /stripeEventId/);
  assert.match(migration, /operacion.*concesion/si);
  assert.match(migration, /operacion.*renovacion/si);
});

test('041 mantiene las excepciones históricas de migración y expiración', () => {
  assert.match(migration, /migracion_legacy/);
  assert.match(migration, /migration_040/);
  assert.match(migration, /tipo_evento = 'expirado'/);
});

test('041 no cambia la FK ni exige actor no nulo', () => {
  assert.doesNotMatch(migration, /ALTER\s+TABLE[^;]+DROP\s+CONSTRAINT[^;]*fk_accesos_oposicion_historial_actor/is);
  assert.doesNotMatch(migration, /actor_usuario_id\s+BIGINT\s+NOT\s+NULL/i);
});

