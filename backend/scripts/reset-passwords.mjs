import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Client } = pg;

const c = new Client({
  connectionString: 'postgresql://postgres:xaUbGIcQGmTrrRKmUSiVAmnrtNNqmcgE@monorail.proxy.rlwy.net:14080/railway',
  ssl: { rejectUnauthorized: false }
});

await c.connect();

const newHash = await bcrypt.hash('albacer2024', 10);

const users = [
  'admin@albacer.test',
  'admin.sprint4@albacer.test',
  'e2e@test.com',
  'profesor.auxiliar@albacer.test',
  'joxerau@gmail.com'
];

for (const email of users) {
  await c.query('UPDATE usuarios SET password_hash = $1 WHERE email = $2', [newHash, email]);
  console.log(`✓ ${email} → albacer2024`);
}

await c.end();
console.log('\nContraseñas actualizadas.');
