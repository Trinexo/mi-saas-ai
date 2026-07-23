/**
 * Alias histórico de bootstrap local.
 *
 * No carga seeds ni permite operar sobre producción. Para migraciones
 * normales debe usarse migrate-official.mjs.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.env.NODE_ENV === 'production' || process.env.ALLOW_LOCAL_DB_BOOTSTRAP !== 'true') {
  console.error('load-db.mjs está deprecado; requiere ALLOW_LOCAL_DB_BOOTSTRAP=true fuera de producción');
  process.exit(1);
}

const bootstrap = fileURLToPath(new URL('./bootstrap-schema-if-empty.mjs', import.meta.url));
const runner = fileURLToPath(new URL('./migrate-official.mjs', import.meta.url));

const child = spawn(process.execPath, [bootstrap], { stdio: 'inherit', env: process.env });
child.on('exit', (code, signal) => {
  if (signal || code !== 0) {
    process.exitCode = 1;
    return;
  }
  const migration = spawn(process.execPath, [runner], { stdio: 'inherit', env: process.env });
  migration.on('exit', (migrationCode, migrationSignal) => {
    process.exitCode = migrationSignal ? 1 : (migrationCode ?? 1);
  });
  migration.on('error', () => { process.exitCode = 1; });
});
child.on('error', () => { process.exitCode = 1; });
