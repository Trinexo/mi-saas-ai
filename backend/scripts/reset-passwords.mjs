import pg from 'pg';
import bcrypt from 'bcryptjs';
import { requiredEnv, requireConfirmation, sslForDatabaseUrl } from './legacy-script-config.mjs';

const { Client } = pg;

requireConfirmation('ALLOW_PASSWORD_RESET');

const databaseUrl = requiredEnv('RAILWAY_DB_URL');
const c = new Client({
  connectionString: databaseUrl,
  ssl: sslForDatabaseUrl(databaseUrl)
});

await c.connect();

const newHash = await bcrypt.hash(requiredEnv('RESET_PASSWORD'), 10);

const users = [
  'admin@albacer.test',
  'admin.sprint4@albacer.test',
  'e2e@test.com',
  'profesor.auxiliar@albacer.test',
  'joxerau@gmail.com'
];

for (const email of users) {
  await c.query('UPDATE usuarios SET password_hash = $1 WHERE email = $2', [newHash, email]);
}

await c.end();
console.log('Contraseñas actualizadas.');
