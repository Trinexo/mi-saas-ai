import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import { requireAuth, requireRole } from '../../src/middleware/auth.middleware.js';
import { ApiError } from '../../src/utils/api-error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

const readRepoFile = (...segments) => fs.readFileSync(path.join(repoRoot, ...segments), 'utf8');
const TEST_JWT_SECRET = 'roles-permisos-test-secret';

const callMiddleware = async (middleware, req = {}) => {
  let nextArg;
  await middleware(req, {}, (arg) => {
    nextArg = arg;
  });
  return { req, nextArg };
};

test('requireAuth rechaza ausencia de token y token invalido', async () => {
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_JWT_SECRET;

  try {
    const noToken = await callMiddleware(requireAuth, { headers: {} });
    assert.ok(noToken.nextArg instanceof ApiError);
    assert.equal(noToken.nextArg.status, 401);

    const invalid = await callMiddleware(requireAuth, {
      headers: { authorization: 'Bearer token-invalido' },
    });
    assert.ok(invalid.nextArg instanceof ApiError);
    assert.equal(invalid.nextArg.status, 401);
  } finally {
    process.env.JWT_SECRET = previousJwtSecret;
  }
});

test('requireAuth hidrata usuario para tokens validos de admin, profesor y alumno', async () => {
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_JWT_SECRET;

  try {
    for (const role of ['admin', 'profesor', 'alumno']) {
      const token = jwt.sign({ userId: role.length, role }, process.env.JWT_SECRET);
      const result = await callMiddleware(requireAuth, {
        headers: { authorization: `Bearer ${token}` },
      });

      assert.equal(result.nextArg, undefined);
      assert.equal(result.req.user.role, role);
      assert.equal(result.req.user.userId, role.length);
    }
  } finally {
    process.env.JWT_SECRET = previousJwtSecret;
  }
});

test('requireRole aplica matriz admin/profesor/alumno en API', async () => {
  const cases = [
    { roles: ['admin'], userRole: 'admin', allowed: true },
    { roles: ['admin'], userRole: 'profesor', allowed: false },
    { roles: ['admin'], userRole: 'alumno', allowed: false },
    { roles: ['profesor'], userRole: 'profesor', allowed: true },
    { roles: ['profesor'], userRole: 'admin', allowed: false },
    { roles: ['admin', 'profesor'], userRole: 'admin', allowed: true },
    { roles: ['admin', 'profesor'], userRole: 'profesor', allowed: true },
    { roles: ['admin', 'profesor'], userRole: 'alumno', allowed: false },
  ];

  for (const item of cases) {
    const result = await callMiddleware(requireRole(...item.roles), {
      user: { userId: 1, role: item.userRole },
    });

    if (item.allowed) {
      assert.equal(result.nextArg, undefined, `${item.userRole} debe acceder a ${item.roles.join(',')}`);
    } else {
      assert.ok(result.nextArg instanceof ApiError, `${item.userRole} debe ser bloqueado`);
      assert.equal(result.nextArg.status, 403);
    }
  }
});

test('rutas backend criticas conservan protecciones por rol', () => {
  const adminCatalogo = readRepoFile('backend', 'src', 'routes', 'v1', 'adminCatalogo.routes.js');
  const adminGestion = readRepoFile('backend', 'src', 'routes', 'v1', 'adminGestion.routes.js');
  const profesor = readRepoFile('backend', 'src', 'routes', 'v1', 'profesor.routes.js');
  const subscriptions = readRepoFile('backend', 'src', 'routes', 'v1', 'subscription.routes.js');
  const billing = readRepoFile('backend', 'src', 'routes', 'v1', 'billing.routes.js');

  assert.match(adminCatalogo, /router\.use\(requireAuth,\s*requireRole\('admin'\)\)/);
  assert.match(adminGestion, /router\.use\(requireAuth,\s*requireRole\('admin',\s*'profesor'\)\)/);
  assert.match(profesor, /router\.use\(requireAuth,\s*requireRole\('profesor'\)\)/);

  for (const route of [
    "/auditoria', requireRole('admin')",
    "/stats', requireRole('admin')",
    "/users', requireRole('admin')",
    "/profesores', requireRole('admin')",
    "/profesores/asignaciones', requireRole('admin')",
  ]) {
    assert.ok(adminGestion.includes(route), `adminGestion debe proteger ${route}`);
  }

  assert.match(subscriptions, /router\.get\('\/me',\s*requireAuth,\s*getMyPlan\)/);
  assert.match(subscriptions, /router\.get\('\/stats',\s*requireAuth,\s*requireRole\('admin'\)/);
  assert.match(subscriptions, /router\.post\('\/users\/:userId',\s*requireAuth,\s*requireRole\('admin'\)/);
  assert.match(billing, /requireAuth,\s*requireRole\('admin'\),\s*validate\(billingOposicionParamSchema/);
});

test('API Express bloquea accesos cruzados de roles antes de ejecutar handlers', async () => {
  const previousJwtSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  const server = app.listen(0);

  try {
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}/api`;
    const tokenFor = (role) => jwt.sign({ userId: 99, role }, process.env.JWT_SECRET);

    const cases = [
      { path: '/admin/users', role: null, status: 401 },
      { path: '/admin/users', role: 'alumno', status: 403 },
      { path: '/admin/users', role: 'profesor', status: 403 },
      { path: '/profesor/dashboard', role: null, status: 401 },
      { path: '/profesor/dashboard', role: 'alumno', status: 403 },
      { path: '/profesor/dashboard', role: 'admin', status: 403 },
      { path: '/subscriptions/stats', role: 'alumno', status: 403 },
      { path: '/billing/oposiciones/1/precio', role: 'profesor', status: 403, method: 'PATCH', body: { precioEuros: 10 } },
    ];

    for (const item of cases) {
      const headers = item.role ? { authorization: `Bearer ${tokenFor(item.role)}` } : {};
      if (item.body) headers['content-type'] = 'application/json';

      const response = await fetch(`${baseUrl}${item.path}`, {
        method: item.method ?? 'GET',
        headers,
        body: item.body ? JSON.stringify(item.body) : undefined,
      });

      assert.equal(response.status, item.status, `${item.role ?? 'sin token'} en ${item.path}`);
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    process.env.JWT_SECRET = previousJwtSecret;
  }
});

test('rutas frontend redirigen cada rol a su area y bloquean areas ajenas', () => {
  const app = readRepoFile('frontend', 'src', 'App.jsx');
  const login = readRepoFile('frontend', 'src', 'components', 'auth', 'LoginForm.jsx');

  assert.ok(app.includes("user?.role === 'admin' && !pathname.startsWith('/admin')"));
  assert.ok(app.includes("return <Navigate to=\"/admin\" replace />"));
  assert.ok(app.includes("user?.role === 'profesor' && !pathname.startsWith('/profesor')"));
  assert.ok(app.includes("return <Navigate to=\"/profesor\" replace />"));
  assert.ok(app.includes("return user?.role === 'admin' ? children : <Navigate to=\"/\" replace />"));
  assert.ok(app.includes("return user?.role === 'profesor' ? children : <Navigate to=\"/\" replace />"));
  assert.ok(app.includes('path="admin"'));
  assert.ok(app.includes('path="profesor"'));
  assert.ok(login.includes("data.user?.role === 'admin' ? '/admin' : data.user?.role === 'profesor' ? '/profesor' : '/catalogo'"));
});
