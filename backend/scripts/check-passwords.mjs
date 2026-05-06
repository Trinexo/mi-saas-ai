import pg from 'pg';
const { Client } = pg;
const c = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/plataforma_test' });
await c.connect();
const r = await c.query(
  `SELECT email, role, password_hash FROM usuarios
   WHERE email IN ($1,$2,$3,$4,$5) ORDER BY role`,
  ['admin@albacer.test','admin.sprint4@albacer.test','e2e@test.com','profesor.auxiliar@albacer.test','joxerau@gmail.com']
);
const knownHash = '$2a$10$C1pB1mtc.MLiodyz.lbFvugYsWVcauhZahIbR5hNXf1TckHNeXOi2';
r.rows.forEach(u => console.log(u.role.padEnd(10), u.email.padEnd(40), u.password_hash === knownHash ? 'albacer2024' : 'CONTRASEÑA DISTINTA'));
await c.end();
