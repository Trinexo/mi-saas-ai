import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('Railway configura pre-deploy oficial y start sin migraciones', () => {
  const railway = fs.readFileSync(path.join(root, 'backend', 'railway.toml'), 'utf8');
  assert.match(railway, /preDeployCommand\s*=\s*\["node backend\/scripts\/migrate-official\.mjs"\]/);
  assert.match(railway, /startCommand\s*=\s*"node backend\/src\/server\.js"/);
  assert.doesNotMatch(railway, /MIGRATIONS_BASELINE|bootstrap-schema|seed\.sql/);
  assert.match(railway, /dockerfilePath\s*=\s*"backend\/Dockerfile"/);
});

test('Docker context conserva migraciones y excluye credenciales locales', () => {
  const dockerignore = fs.readFileSync(path.join(root, '.dockerignore'), 'utf8');
  const dockerfile = fs.readFileSync(path.join(root, 'backend', 'Dockerfile'), 'utf8');
  assert.match(dockerignore, /\.env\.\*/);
  assert.match(dockerignore, /\*\*\/node_modules/);
  assert.doesNotMatch(dockerignore, /database\/migrations/);
  assert.match(dockerfile, /COPY database \.\/database/);
  assert.match(dockerfile, /CMD \["node", "backend\/src\/server\.js"\]/);
});

test('baseline separado exige dry-run o confirmación explícita', () => {
  const source = fs.readFileSync(path.join(root, 'backend', 'scripts', 'baseline-migrations.mjs'), 'utf8');
  assert.match(source, /--dry-run/);
  assert.match(source, /--confirm=BASELINE/);
  assert.match(source, /pg_advisory_lock/);
  assert.doesNotMatch(source, /client\.query\(.*sql/);
});
