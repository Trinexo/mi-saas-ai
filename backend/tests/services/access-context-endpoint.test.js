import assert from 'node:assert/strict';
import http from 'node:http';
import test, { after, before } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import { accessContextService } from '../../src/services/accessContext.service.js';
import { accesoOposicionService } from '../../src/services/accesoOposicion.service.js';
import { requireAccesoOposicion } from '../../src/middleware/acceso.middleware.js';

const TEST_SECRET = 'access-context-endpoint-test-secret';
const TEST_USER_ID = 42;
const TEST_OPOSICION_ID = '123';

const dtoSinAcceso = {
  usuario_id: TEST_USER_ID,
  oposicion_id: TEST_OPOSICION_ID,
  tiene_acceso: false,
  acceso_id: null,
  estado: null,
  estado_efectivo: 'sin_acceso',
  vigencia: { fecha_inicio: null, fecha_fin: null, esta_vigente: false, dias_restantes: null },
  modelos_disponibles: [],
  modo_activo: null,
  permisos: {
    puede_acceder_contenido: false,
    puede_usar_experto: false,
    puede_usar_guiado: false,
    puede_cambiar_modo: false,
  },
  acciones_administrativas: {
    puede_renovar: false,
    puede_modificar_modelos: false,
    puede_modificar_vigencia: false,
    puede_revocar: false,
    puede_cancelar: false,
    puede_reactivar: false,
  },
  legacy: { modo_preparacion: null, modo_preparacion_normalizado: null },
};

const dtoActivo = {
  ...dtoSinAcceso,
  tiene_acceso: true,
  acceso_id: 9001,
  estado: 'activo',
  estado_efectivo: 'activo',
  modelos_disponibles: ['experto'],
  modo_activo: 'experto',
};

let originalSecret;
let server;
let baseUrl;
let middlewareServer;
let middlewareBaseUrl;

before(async () => {
  originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_SECRET;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const middlewareApp = express();
  middlewareApp.get('/protected/:oposicionId',
    (req, _res, next) => {
      req.user = { userId: TEST_USER_ID, role: 'alumno' };
      next();
    },
    requireAccesoOposicion('strict'),
    (_req, res) => res.json({ success: true }),
  );
  middlewareApp.use((error, _req, res, _next) => res.status(error.status ?? 500).json({
    success: false,
    message: error.message,
  }));
  middlewareServer = http.createServer(middlewareApp);
  await new Promise((resolve) => middlewareServer.listen(0, '127.0.0.1', resolve));
  middlewareBaseUrl = `http://127.0.0.1:${middlewareServer.address().port}`;
});

after(async () => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await new Promise((resolve, reject) => middlewareServer.close((error) => (error ? reject(error) : resolve())));
});

function token({ userId = TEST_USER_ID, role = 'alumno' } = {}) {
  return jwt.sign({ userId, role }, TEST_SECRET);
}

async function request(path, { authToken } = {}) {
  const headers = authToken ? { authorization: `Bearer ${authToken}` } : {};
  const response = await fetch(`${baseUrl}${path}`, { headers });
  return { status: response.status, body: await response.json() };
}

async function requestMiddleware(path) {
  const response = await fetch(`${middlewareBaseUrl}${path}`);
  return { status: response.status, body: await response.json() };
}

async function withServiceMock(implementation, callback) {
  const original = accessContextService.obtenerContextoUsuario;
  accessContextService.obtenerContextoUsuario = implementation;
  try {
    return await callback();
  } finally {
    accessContextService.obtenerContextoUsuario = original;
  }
}

const options = { concurrency: false };

test('sin token devuelve 401', options, async () => {
  const response = await request(`/api/v1/accesos/contexto/${TEST_OPOSICION_ID}`);
  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('token inválido devuelve 401', options, async () => {
  const response = await request(`/api/v1/accesos/contexto/${TEST_OPOSICION_ID}`, { authToken: 'invalid' });
  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('profesor y admin no pueden usar el endpoint de alumno', options, async () => {
  for (const role of ['profesor', 'admin']) {
    const response = await request(`/api/v1/accesos/contexto/${TEST_OPOSICION_ID}`, {
      authToken: token({ role }),
    });
    assert.equal(response.status, 403);
  }
});

test('valida oposicionId sin coerción numérica', options, async () => {
  for (const value of ['0', '-1', '1.5', ' 1', '1 ', '1e2', '+1', '9223372036854775808']) {
    const response = await request(`/api/v1/accesos/contexto/${encodeURIComponent(value)}`, {
      authToken: token(),
    });
    assert.equal(response.status, 400, value);
  }
});

test('acepta el máximo BIGINT y lo conserva como string', options, async () => {
  const calls = [];
  const maxId = '9223372036854775807';
  const response = await withServiceMock(async (args) => {
    calls.push(args);
    return { ...dtoSinAcceso, oposicion_id: maxId };
  }, async () => request(`/api/v1/accesos/contexto/${maxId}`, { authToken: token() }));
  assert.equal(response.status, 200);
  assert.equal(response.body.data.oposicion_id, maxId);
  assert.equal(typeof calls[0].oposicionId, 'string');
  assert.equal(calls[0].oposicionId, maxId);
});

test('alumno válido construye el principal correcto y devuelve sin_acceso', options, async () => {
  const calls = [];
  const response = await withServiceMock(async (args) => {
    calls.push(args);
    return dtoSinAcceso;
  }, async () => request(`/api/v1/accesos/contexto/${TEST_OPOSICION_ID}`, { authToken: token() }));
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, 'Contexto de acceso');
  assert.deepEqual(response.body.data, dtoSinAcceso);
  assert.deepEqual(calls, [{
    usuarioId: TEST_USER_ID,
    oposicionId: TEST_OPOSICION_ID,
    principal: { tipo: 'alumno', usuarioId: TEST_USER_ID },
  }]);
});

test('devuelve el DTO activo envuelto en data', options, async () => {
  const response = await withServiceMock(async () => dtoActivo, async () => (
    request(`/api/v1/accesos/contexto/${TEST_OPOSICION_ID}`, { authToken: token() })
  ));
  assert.equal(response.status, 200);
  assert.equal(response.body.data.estado_efectivo, 'activo');
  assert.equal(response.body.data.modo_activo, 'experto');
});

test('mapea oposición inexistente y principal inválido', options, async () => {
  const opposition = await withServiceMock(async () => {
    const error = new Error('oposición interna no encontrada');
    error.code = 'ACCESS_CONTEXT_OPPOSITION_NOT_FOUND';
    throw error;
  }, async () => request(`/api/v1/accesos/contexto/${TEST_OPOSICION_ID}`, { authToken: token() }));
  assert.equal(opposition.status, 404);
  assert.equal(opposition.body.message, 'Oposición no encontrada');

  const principal = await withServiceMock(async () => {
    const error = new Error('principal inválido');
    error.code = 'ACCESS_CONTEXT_INVALID_PRINCIPAL';
    throw error;
  }, async () => request(`/api/v1/accesos/contexto/${TEST_OPOSICION_ID}`, { authToken: token() }));
  assert.equal(principal.status, 401);
  assert.equal(principal.body.message, 'Contexto de autenticación inválido');
});

test('mapea inconsistencia y errores técnicos sin filtrar detalles', options, async () => {
  for (const code of ['ACCESS_CONTEXT_INCONSISTENT', undefined]) {
    const response = await withServiceMock(async () => {
      const error = new Error('SQL constraint violated; postgres://secret@example.invalid');
      if (code) error.code = code;
      throw error;
    }, async () => request(`/api/v1/accesos/contexto/${TEST_OPOSICION_ID}`, { authToken: token() }));
    assert.equal(response.status, 500);
    assert.equal(response.body.message, 'No se pudo resolver el contexto');
    assert.doesNotMatch(JSON.stringify(response.body), /SQL|constraint|postgres|secret/i);
  }
});

test('no invoca mutaciones ni historial', options, async () => {
  const calls = [];
  await withServiceMock(async (args) => {
    calls.push(args);
    return dtoSinAcceso;
  }, async () => request(`/api/v1/accesos/contexto/${TEST_OPOSICION_ID}`, { authToken: token() }));
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys(calls[0]).sort(), ['oposicionId', 'principal', 'usuarioId']);
});

test('mis-oposiciones conserva el DTO legacy', options, async () => {
  const original = accesoOposicionService.getMisAccesos;
  const legacy = [{
    oposicion_id: '7',
    nombre: 'Oposicion',
    fecha_fin: null,
    tipo_alumno: 'libre',
    modo_preparacion: 'albacer',
    ranking_publico: false,
  }];
  accesoOposicionService.getMisAccesos = async (userId) => {
    assert.equal(userId, TEST_USER_ID);
    return legacy;
  };
  try {
    const response = await request('/api/accesos/mis-oposiciones', { authToken: token() });
    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, legacy);
  } finally {
    accesoOposicionService.getMisAccesos = original;
  }
});

test('check y preparación legacy delegan en lecturas canónicas', options, async () => {
  const originalContext = accessContextService.obtenerContextoUsuario;
  const originalPreparation = accesoOposicionService.getPreparacion;
  const calls = [];
  accessContextService.obtenerContextoUsuario = async (args) => {
    calls.push(args);
    return { permisos: { puede_acceder_contenido: true } };
  };
  accesoOposicionService.getPreparacion = async (userId, oposicionId) => ({
    usuario_id: userId,
    oposicion_id: oposicionId,
    nombre: 'Oposicion',
    tipo_alumno: 'libre',
    modo_preparacion: 'experto',
    ranking_publico: false,
  });
  try {
    const check = await request('/api/accesos/check/7', { authToken: token() });
    const preparation = await request('/api/accesos/oposicion/7/preparacion', { authToken: token() });
    assert.equal(check.status, 200);
    assert.equal(check.body.data.tieneAcceso, true);
    assert.equal(preparation.status, 200);
    assert.equal(preparation.body.data.modo_preparacion, 'experto');
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].principal, { tipo: 'alumno', usuarioId: TEST_USER_ID });
  } finally {
    accessContextService.obtenerContextoUsuario = originalContext;
    accesoOposicionService.getPreparacion = originalPreparation;
  }
});

test('requireAccesoOposicion usa contexto canónico', options, async () => {
  const original = accessContextService.obtenerContextoUsuario;
  let call;
  accessContextService.obtenerContextoUsuario = async (args) => {
    call = args;
    return { permisos: { puede_acceder_contenido: false } };
  };
  try {
    const response = await requestMiddleware('/protected/7');
    assert.equal(response.status, 403);
    assert.equal(response.body.success, false);
    assert.deepEqual(call.principal, { tipo: 'alumno', usuarioId: TEST_USER_ID });
  } finally {
    accessContextService.obtenerContextoUsuario = original;
  }
});
