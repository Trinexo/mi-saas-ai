import assert from 'node:assert/strict';
import test from 'node:test';
import { assertPostgresUtc } from '../../src/config/postgres-timezone.guard.js';

function poolReturning(row) {
  let released = 0;
  const client = { async query() { return { rows: [row] }; }, release() { released += 1; } };
  return { get released() { return released; }, async connect() { return client; } };
}

test('permite PostgreSQL UTC', async () => {
  const pool = poolReturning({ timezone: 'UTC', is_utc: true });
  assert.equal(await assertPostgresUtc(pool), 'UTC'); assert.equal(pool.released, 1);
});
test('permite Etc/UTC equivalente', async () => {
  const pool = poolReturning({ timezone: 'Etc/UTC', is_utc: true });
  assert.equal(await assertPostgresUtc(pool), 'Etc/UTC'); assert.equal(pool.released, 1);
});
test('bloquea Europe/Paris', async () => {
  const pool = poolReturning({ timezone: 'Europe/Paris', is_utc: false });
  await assert.rejects(() => assertPostgresUtc(pool), { code: 'POSTGRES_TIMEZONE_NOT_UTC' }); assert.equal(pool.released, 1);
});
test('bloquea un timezone inesperado', async () => {
  const pool = poolReturning({ timezone: 'America/New_York', is_utc: false });
  await assert.rejects(() => assertPostgresUtc(pool), { code: 'POSTGRES_TIMEZONE_NOT_UTC' }); assert.equal(pool.released, 1);
});
test('falla cerrado si no puede consultar PostgreSQL', async () => {
  const pool = { released: 0, async connect() { return { async query() { throw new Error('connection failed'); }, release() { pool.released += 1; } }; } };
  await assert.rejects(() => assertPostgresUtc(pool), { code: 'POSTGRES_TIMEZONE_GUARD_FAILED' }); assert.equal(pool.released, 1);
});
test('no escribe datos ni produce efectos secundarios', async () => {
  const calls = [];
  const pool = { async connect() { return { async query(sql) { calls.push(sql); return { rows: [{ timezone: 'UTC', is_utc: true }] }; }, release() {} }; } };
  await assertPostgresUtc(pool); assert.equal(calls.length, 1); assert.match(calls[0], /current_setting\('TimeZone'\)/);
  assert.doesNotMatch(calls[0], /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE)\b/i);
});
