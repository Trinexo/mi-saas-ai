import pg from 'pg';
const { Client } = pg;

const c = new Client({
  connectionString: 'postgresql://postgres:xaUbGIcQGmTrrRKmUSiVAmnrtNNqmcgE@monorail.proxy.rlwy.net:14080/railway',
  ssl: { rejectUnauthorized: false }
});

await c.connect();

const keep = [
  'admin@albacer.test',
  'admin.sprint4@albacer.test',
  'e2e@test.com',
  'profesor.auxiliar@albacer.test',
  'joxerau@gmail.com'
];

const del = await c.query(
  `DELETE FROM usuarios WHERE email NOT IN ('admin@albacer.test','admin.sprint4@albacer.test','e2e@test.com','profesor.auxiliar@albacer.test','joxerau@gmail.com')`
);
console.log('Eliminados:', del.rowCount);

const rem = await c.query('SELECT email, role FROM usuarios ORDER BY role, email');
console.log('Usuarios restantes:');
rem.rows.forEach(u => console.log(` ${u.role} - ${u.email}`));

await c.end();
