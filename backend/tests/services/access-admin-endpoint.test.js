import assert from 'node:assert/strict';
import http from 'node:http';
import test, { after, before } from 'node:test';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';

const SECRET = 'access-admin-endpoint-test-secret';
let server;
let baseUrl;

before(async () => {
  process.env.JWT_SECRET = SECRET;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

function token(role = 'admin') {
  return jwt.sign({ userId: '7000000000000001', role }, SECRET);
}

async function request(path, { role, method = 'GET', body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      authorization: role ? `Bearer ${token(role)}` : undefined,
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test('admin access routes reject unauthenticated requests', async () => {
  const response = await request('/api/v1/admin/accesos', { method: 'POST', body: {} });
  assert.equal(response.status, 401);
});

test('admin access routes reject alumno and profesor', async () => {
  for (const role of ['alumno', 'profesor']) {
    const response = await request('/api/v1/admin/accesos', { role, method: 'POST', body: {} });
    assert.equal(response.status, 403);
  }
});

test('create route validates BIGINT, models, dates and motive before service', async () => {
  const response = await request('/api/v1/admin/accesos', {
    role: 'admin',
    method: 'POST',
    body: {
      usuarioId: '9223372036854775808',
      oposicionId: '2',
      modelos: ['experto'],
      vigencia: { fechaInicio: '2026-01-01', fechaFin: null },
      motivo: 'alta administrativa',
    },
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test('model and validity routes reject invalid access IDs and missing motive', async () => {
  const modelResponse = await request('/api/v1/admin/accesos/0/modelos', {
    role: 'admin', method: 'PATCH', body: { modelos: ['experto'], motivo: 'x' },
  });
  const validityResponse = await request('/api/v1/admin/accesos/1/vigencia', {
    role: 'admin', method: 'PATCH', body: { fechaFin: null },
  });
  assert.equal(modelResponse.status, 400);
  assert.equal(validityResponse.status, 400);
});

test('history route has the exact administrative URL and validates IDs', async () => {
  const response = await request('/api/v1/admin/accesos/not-an-id/historial', { role: 'admin' });
  assert.equal(response.status, 400);
});

test('PR6 mutation routes están montadas y validan el motivo', async () => {
  for (const path of ['/api/v1/admin/accesos/1/renovar', '/api/v1/admin/accesos/1/revocar', '/api/v1/admin/accesos/1/cancelar', '/api/v1/admin/accesos/1/reactivar']) {
    const response = await request(path, { role: 'admin', method: 'POST', body: {} });
    assert.equal(response.status, 400);
  }
});
