/**
 * TKT-030 — Smoke E2E pre-release
 *
 * Ejercita el flujo completo contra la API real en localhost:3000.
 * Requiere: servidor backend en marcha + seed inicial cargado.
 *
 * Ejecutar:
 *   node --test tests/smoke/e2e-smoke.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = 'http://localhost:3000/api';
const ADMIN_EMAIL = 'admin@albacer.test';
const ADMIN_PASSWORD = 'albacer2024';

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  return { status: res.status, data: json.data, message: json.message };
}

// ── Flujo usuario ──────────────────────────────────────────────
let userToken;
const timestamp = Date.now();
const userEmail = `smoke_user_${timestamp}@test.com`;

test('SMOKE-U01: registro de usuario', async () => {
  const { status, data } = await api('/auth/register', {
    method: 'POST',
    body: { nombre: 'Smoke User', email: userEmail, password: 'pass1234' },
  });
  assert.equal(status, 201);
  assert.ok(data.id > 0, 'Debe devolver el id del usuario creado');
});

test('SMOKE-U02: login de usuario', async () => {
  const { status, data } = await api('/auth/login', {
    method: 'POST',
    body: { email: userEmail, password: 'pass1234' },
  });
  assert.equal(status, 200);
  assert.ok(data.token);
  userToken = data.token;
});

test('SMOKE-U03: catálogo oposiciones', async () => {
  const { status, data } = await api('/oposiciones');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data), 'Debe ser array');
  assert.ok(data.length > 0, 'Debe haber al menos 1 oposición');
});

test('SMOKE-U04: catálogo materias', async () => {
  const { status, data } = await api('/materias?oposicion_id=1');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data));
});

test('SMOKE-U05: catálogo temas', async () => {
  const { status, data } = await api('/temas?materia_id=1');
  assert.equal(status, 200);
  assert.ok(Array.isArray(data));
});

let testId;
let preguntasTest;

test('SMOKE-U06: generar test', async () => {
  const { status, data } = await api('/tests/generate', {
    method: 'POST',
    token: userToken,
    body: { temaId: 1, numeroPreguntas: 5 },
  });
  assert.equal(status, 201);
  assert.ok(data.testId > 0);
  assert.ok(data.preguntas.length > 0);
  testId = Number(data.testId);
  preguntasTest = data.preguntas;
});

test('SMOKE-U07: enviar test con todas las respuestas', async () => {
  const respuestas = preguntasTest.map((p) => ({
    preguntaId: Number(p.id),
    respuestaId: Number(p.opciones[0].id),
  }));
  const { status, data } = await api('/tests/submit', {
    method: 'POST',
    token: userToken,
    body: { testId, respuestas },
  });
  assert.equal(status, 200);
  assert.ok(typeof data.aciertos === 'number');
  assert.ok(typeof data.errores === 'number');
  assert.ok(typeof data.nota !== 'undefined');
});

test('SMOKE-U07B: generar test sin enviar no debe contar en estadísticas finalizadas', async () => {
  const { status, data } = await api('/tests/generate', {
    method: 'POST',
    token: userToken,
    body: { temaId: 1, numeroPreguntas: 5 },
  });

  assert.ok([201, 400].includes(status));

  if (status === 201) {
    assert.ok(data.testId > 0);
  }
});

test('SMOKE-U08: estadísticas de usuario', async () => {
  const { status, data } = await api('/stats/user', { token: userToken });
  assert.equal(status, 200);
  assert.equal(data.total_tests, 1);
});

test('SMOKE-U09: estadísticas por tema', async () => {
  const { status, data } = await api('/stats/tema?tema_id=1', { token: userToken });
  assert.equal(status, 200);
  assert.ok(typeof data.preguntas_vistas === 'number');
});

// ── Flujo admin ────────────────────────────────────────────────
let adminToken;

test('SMOKE-A01: login admin', async () => {
  const { status, data } = await api('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.equal(status, 200, `Login admin falló: ${data?.message}`);
  adminToken = data.token;
});

test('SMOKE-A02: listar preguntas admin', async () => {
  const { status, data } = await api('/admin/preguntas?page=1&page_size=5', { token: adminToken });
  assert.equal(status, 200);
  assert.ok(Array.isArray(data.preguntas ?? data.items ?? []));
});

let createdPreguntaId;

test('SMOKE-A03: crear pregunta', async () => {
  const { status, data } = await api('/admin/preguntas', {
    method: 'POST',
    token: adminToken,
    body: {
      temaId: 1,
      enunciado: 'Smoke test pregunta E2E',
      explicacion: 'Test explicación',
      referenciaNormativa: null,
      nivelDificultad: 2,
      opciones: [
        { texto: 'Opción A', correcta: true },
        { texto: 'Opción B', correcta: false },
        { texto: 'Opción C', correcta: false },
        { texto: 'Opción D', correcta: false },
      ],
    },
  });
  assert.equal(status, 201);
  assert.ok(data.id > 0);
  createdPreguntaId = data.id;
});

test('SMOKE-A04: obtener pregunta por id', async () => {
  const { status, data } = await api(`/admin/preguntas/${createdPreguntaId}`, { token: adminToken });
  assert.equal(status, 200);
  assert.equal(data.enunciado, 'Smoke test pregunta E2E');
  assert.equal(data.opciones.length, 4);
});

test('SMOKE-A05: editar pregunta', async () => {
  const { status, data } = await api(`/admin/preguntas/${createdPreguntaId}`, {
    method: 'PUT',
    token: adminToken,
    body: {
      temaId: 1,
      enunciado: 'Smoke test pregunta E2E (editada)',
      explicacion: 'Explicación actualizada',
      referenciaNormativa: null,
      nivelDificultad: 3,
      opciones: [
        { texto: 'Opción A actualizada', correcta: false },
        { texto: 'Opción B actualizada', correcta: true },
        { texto: 'Opción C actualizada', correcta: false },
        { texto: 'Opción D actualizada', correcta: false },
      ],
    },
  });
  assert.equal(status, 200);
  assert.ok(data.id);
});

test('SMOKE-A06: eliminar pregunta', async () => {
  const { status, data } = await api(`/admin/preguntas/${createdPreguntaId}`, {
    method: 'DELETE',
    token: adminToken,
  });
  assert.equal(status, 200);
  assert.ok(data.id ?? data.deleted);
});

test('SMOKE-A07: pregunta eliminada devuelve 404', async () => {
  const { status } = await api(`/admin/preguntas/${createdPreguntaId}`, { token: adminToken });
  assert.equal(status, 404);
});

test('SMOKE-A08: listar reportes', async () => {
  const { status } = await api('/admin/reportes?page=1&page_size=5', { token: adminToken });
  assert.equal(status, 200);
});

// ── Seguridad básica ───────────────────────────────────────────
test('SMOKE-S01: ruta protegida sin token = 401', async () => {
  const { status } = await api('/tests/generate', { method: 'POST', body: { temaId: 1, numPreguntas: 5 } });
  assert.equal(status, 401);
});

test('SMOKE-S02: ruta admin con token de usuario = 403', async () => {
  const { status } = await api('/admin/preguntas', { token: userToken });
  assert.equal(status, 403);
});

test('SMOKE-S03: login con credenciales incorrectas = 401', async () => {
  const { status } = await api('/auth/login', {
    method: 'POST',
    body: { email: userEmail, password: 'wrongpass' },
  });
  assert.equal(status, 401);
});
