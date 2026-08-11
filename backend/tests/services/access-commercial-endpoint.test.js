import assert from 'node:assert/strict';
import http from 'node:http';
import test, { after, before } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';

const SECRET = 'access-commercial-endpoint-test-secret';
let server;
let baseUrl;

before(async () => {
  process.env.JWT_SECRET = SECRET;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = 'http://127.0.0.1:' + server.address().port;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

async function request(path, role, body) {
  const headers = { 'content-type': 'application/json' };
  if (role) headers.authorization = 'Bearer ' + jwt.sign({ userId: '7000000000000001', role }, SECRET);
  const response = await fetch(baseUrl + path, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test('ruta comercial canónica exige motivo y permanece limitada a admin', async () => {
  const invalid = await request('/api/v1/admin/accesos/1/datos-comerciales', 'admin', { notas: 'x' });
  const forbidden = await request('/api/v1/admin/accesos/1/datos-comerciales', 'alumno', { notas: 'x', motivo: 'x' });
  assert.equal(invalid.status, 400);
  assert.equal(forbidden.status, 403);
});
