/**
 * Compatibilidad temporal para el comando manual histórico.
 *
 * Las migraciones oficiales viven exclusivamente en database/migrations/.
 * Mantener este alias evita que procedimientos antiguos vuelvan a usar
 * backend/database/migrations/.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const runner = fileURLToPath(new URL('./migrate-official.mjs', import.meta.url));
const child = spawn(process.execPath, [runner], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Runner detenido por ${signal}`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});

child.on('error', (error) => {
  console.error(`No se pudo iniciar el runner oficial: ${error.message}`);
  process.exitCode = 1;
});
