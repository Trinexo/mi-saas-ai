import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import test, { after, before } from 'node:test';
import app from '../../src/app.js';
import { profesorWorkspaceSeleccionService } from '../../src/services/profesorWorkspaceSeleccion.service.js';

const SECRET = 'admin-tests-routing-test-secret';
let server;
let baseUrl;
const originalSeleccionarAdmin = profesorWorkspaceSeleccionService.seleccionarAdmin;

before(async () => {
  process.env.JWT_SECRET = SECRET;
  profesorWorkspaceSeleccionService.seleccionarAdmin = async (payload) => ({
    preguntas: [{ id: '9001', tema_id: payload.tema_ids[0] }],
    grupos: [], resumen_temas: [], total_seleccionadas: 1, avisos: [],
  });
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  profesorWorkspaceSeleccionService.seleccionarAdmin = originalSeleccionarAdmin;
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

const token = jwt.sign({ userId: '7000000000000001', role: 'admin' }, SECRET);

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test('la selección estática no se interpreta como /:id/preguntas', async () => {
  const result = await post('/api/admin/tests/seleccion/preguntas', {
    oposicion_id: '8', tema_ids: ['1', '2'], cantidad: 2, dificultad: null,
    officialidad: 'all', anio_ids: [], examen_id: null, simulacro_id: '123',
    exclude_ids: [], reparto_por_tema: false, permitir_completar_con_otros_temas: false,
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.data.total_seleccionadas, 1);
  assert.notEqual(result.body.details?.fieldErrors?.id?.[0], 'Expected number, received nan');
});

test('las rutas que realmente esperan un ID siguen rechazando texto', async () => {
  const result = await post('/api/admin/tests/abc/preguntas', { pregunta_ids: ['1'] });
  assert.equal(result.status, 400);
  assert.match(JSON.stringify(result.body), /Expected number, received nan/);
});
