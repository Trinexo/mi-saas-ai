import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const dbUrl = process.env.MIGRATION_RUNNER_TEST_DATABASE_URL;
const enabled = Boolean(dbUrl && process.env.MIGRATION_RUNNER_TEST_CONFIRM === 'ISOLATED');
const runnerPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../scripts/migrate-official.mjs',
);
const runnerUrl = pathToFileURL(runnerPath).href;

function runChild(directory) {
  const source = [
    'import { run } from ' + JSON.stringify(runnerUrl) + ';',
    'await run({ migrationsDir: process.env.MIGRATION_RUNNER_TEST_DIR });',
  ].join('\n');
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', source], {
      env: { ...process.env, DATABASE_URL: dbUrl, MIGRATION_RUNNER_TEST_DIR: directory },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('runner concurrente excedió el timeout'));
    }, 10000);
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      clearTimeout(timeout);
      resolve({ code, signal, output });
    });
  });
}

test('runner PostgreSQL: rollback, checksum y concurrencia', { skip: !enabled }, async () => {
  const client = new Client({ connectionString: dbUrl, ssl: false });
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'migration-runner-'));
  try {
    await client.connect();
    await client.query('DROP TABLE IF EXISTS runner_concurrency_probe, runner_failure_probe, schema_migrations');
    await fs.writeFile(
      path.join(directory, '001_concurrency.sql'),
      'CREATE TABLE runner_concurrency_probe (id INTEGER); SELECT pg_sleep(2);',
    );

    const first = runChild(directory);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const second = runChild(directory);
    const results = await Promise.all([first, second]);
    assert.equal(results[0].code, 0, results[0].output);
    assert.equal(results[1].code, 0, results[1].output);

    const applied = await client.query(
      "SELECT COUNT(*)::int AS count FROM schema_migrations WHERE filename = '001_concurrency.sql' AND status = 'applied'",
    );
    assert.equal(applied.rows[0].count, 1);

    await fs.writeFile(
      path.join(directory, '001_concurrency.sql'),
      'CREATE TABLE runner_concurrency_probe (id INTEGER, changed BOOLEAN); SELECT pg_sleep(2);',
    );
    const checksumFailure = await runChild(directory);
    assert.notEqual(checksumFailure.code, 0);

    await client.query('DROP TABLE schema_migrations');
    await fs.rm(directory, { recursive: true, force: true });
    const failureDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'migration-runner-failure-'));
    try {
      await fs.writeFile(
        path.join(failureDirectory, '001_failure.sql'),
        'CREATE TABLE runner_failure_probe (id INTEGER); SELECT 1 / 0;',
      );
      const failure = await runChild(failureDirectory);
      assert.notEqual(failure.code, 0);
      const registry = await client.query(
        "SELECT COUNT(*)::int AS count FROM schema_migrations WHERE filename = '001_failure.sql'",
      );
      assert.equal(registry.rows[0].count, 0);
      const table = await client.query("SELECT to_regclass('public.runner_failure_probe') AS name");
      assert.equal(table.rows[0].name, null);
    } finally {
      await fs.rm(failureDirectory, { recursive: true, force: true });
    }
  } finally {
    await client.query('DROP TABLE IF EXISTS runner_concurrency_probe, runner_failure_probe, schema_migrations').catch(() => {});
    await client.end().catch(() => {});
    await fs.rm(directory, { recursive: true, force: true });
  }
});
