/**
 * Test de regresión — flujo de planificación académica del profesor.
 *
 * Cubre:
 *   - list: listado por userId + filtros
 *   - get: obtención por id con verificación de propiedad
 *   - create: validaciones de acceso y creación
 *   - update: modificaciones parciales y validación de estado
 *   - archive: archivado
 *   - resultados: paginación de resultados por alumno
 *   - enviarRecordatorio: cálculo de alumnos pendientes y envío
 *
 * Todos los repositorios se mockean — no requiere base de datos.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { profesorWorkspacePlanificacionService } from '../../src/services/profesorWorkspacePlanificacion.service.js';
import { profesorWorkspacePlanificacionRepository } from '../../src/repositories/profesorWorkspacePlanificacion.repository.js';
import { profesorAccessRepository } from '../../src/repositories/profesorAccess.repository.js';
import { notificacionesRepository } from '../../src/repositories/notificaciones.repository.js';
import { ApiError } from '../../src/utils/api-error.js';

// ---------------------------------------------------------------------------
// Helpers de mock y restauración
// ---------------------------------------------------------------------------

function snapshot(...repos) {
  return repos.map((repo) => ({ repo, copy: { ...repo } }));
}

function restore(snapshots) {
  for (const { repo, copy } of snapshots) {
    Object.keys(copy).forEach((k) => { repo[k] = copy[k]; });
  }
}

const BASE_ITEM = {
  id: 1,
  oposicion_id: 10,
  oposicion_nombre: 'Auxilio Judicial',
  tipo: 'plantilla_test',
  estado: 'borrador',
  titulo: 'Repaso Tema 1',
  descripcion: null,
  fecha_inicio: '2026-06-01',
  fecha_fin: '2026-06-08',
  plantilla_test_id: 99,
  simulacro_id: null,
  notificar_alumnos: false,
  notificada_en: null,
  creado_por_usuario_id: 1,
  creado_por_rol: 'profesor',
  temas: [],
  intentos_total: 0,
  alumnos_iniciados: 0,
  completados: 0,
  nota_media: 0,
};

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

test('list — devuelve planificaciones del profesor', async () => {
  const snaps = snapshot(profesorWorkspacePlanificacionRepository);
  profesorWorkspacePlanificacionRepository.listForProfesor = async () => [BASE_ITEM];

  const result = await profesorWorkspacePlanificacionService.list(1, {});
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 1);

  restore(snaps);
});

test('list — pasa oposicion_id al repositorio cuando se indica', async () => {
  const snaps = snapshot(profesorWorkspacePlanificacionRepository);
  let capturedFilter;
  profesorWorkspacePlanificacionRepository.listForProfesor = async (filter) => {
    capturedFilter = filter;
    return [];
  };

  await profesorWorkspacePlanificacionService.list(5, { oposicion_id: 10 });
  assert.equal(Number(capturedFilter.oposicionId), 10);

  restore(snaps);
});

// ---------------------------------------------------------------------------
// get
// ---------------------------------------------------------------------------

test('get — devuelve el item si pertenece al profesor', async () => {
  const snaps = snapshot(profesorWorkspacePlanificacionRepository);
  profesorWorkspacePlanificacionRepository.getForProfesor = async () => BASE_ITEM;

  const result = await profesorWorkspacePlanificacionService.get(1, 1);
  assert.equal(result.id, 1);

  restore(snaps);
});

test('get — lanza 404 si no existe o no es del profesor', async () => {
  const snaps = snapshot(profesorWorkspacePlanificacionRepository);
  profesorWorkspacePlanificacionRepository.getForProfesor = async () => null;

  await assert.rejects(
    () => profesorWorkspacePlanificacionService.get(1, 999),
    (err) => err instanceof ApiError && err.status === 404,
  );

  restore(snaps);
});

// ---------------------------------------------------------------------------
// create — validatePayload
// ---------------------------------------------------------------------------

test('create — lanza 403 si el profesor no tiene la oposición asignada', async () => {
  const snaps = snapshot(profesorAccessRepository, profesorWorkspacePlanificacionRepository);
  profesorAccessRepository.hasAssignedOposicion = async () => false;

  await assert.rejects(
    () => profesorWorkspacePlanificacionService.create(1, { oposicion_id: 10, tipo: 'plantilla_test', plantilla_test_id: 99, titulo: 'T', fecha_inicio: '2026-06-01', fecha_fin: '2026-06-08' }),
    (err) => err instanceof ApiError && err.status === 403,
  );

  restore(snaps);
});

test('create — lanza 404 si la plantilla_test no existe', async () => {
  const snaps = snapshot(profesorAccessRepository, profesorWorkspacePlanificacionRepository);
  profesorAccessRepository.hasAssignedOposicion = async () => true;
  profesorWorkspacePlanificacionRepository.getDependencyOposicion = async () => null;

  await assert.rejects(
    () => profesorWorkspacePlanificacionService.create(1, { oposicion_id: 10, tipo: 'plantilla_test', plantilla_test_id: 99, titulo: 'T', fecha_inicio: '2026-06-01', fecha_fin: '2026-06-08' }),
    (err) => err instanceof ApiError && err.status === 404,
  );

  restore(snaps);
});

test('create — lanza 400 si la plantilla_test pertenece a otra oposición', async () => {
  const snaps = snapshot(profesorAccessRepository, profesorWorkspacePlanificacionRepository);
  profesorAccessRepository.hasAssignedOposicion = async () => true;
  profesorWorkspacePlanificacionRepository.getDependencyOposicion = async () => ({ oposicion_id: 999 });

  await assert.rejects(
    () => profesorWorkspacePlanificacionService.create(1, { oposicion_id: 10, tipo: 'plantilla_test', plantilla_test_id: 99, titulo: 'T', fecha_inicio: '2026-06-01', fecha_fin: '2026-06-08' }),
    (err) => err instanceof ApiError && err.status === 400,
  );

  restore(snaps);
});

test('create — crea correctamente y devuelve el item completo', async () => {
  const snaps = snapshot(profesorAccessRepository, profesorWorkspacePlanificacionRepository, notificacionesRepository);
  profesorAccessRepository.hasAssignedOposicion = async () => true;
  profesorWorkspacePlanificacionRepository.getDependencyOposicion = async () => ({ oposicion_id: 10 });
  profesorWorkspacePlanificacionRepository.create = async () => ({ id: 7 });
  profesorWorkspacePlanificacionRepository.replaceTemas = async () => {};
  profesorWorkspacePlanificacionRepository.getForProfesor = async () => ({ ...BASE_ITEM, id: 7 });

  const result = await profesorWorkspacePlanificacionService.create(1, {
    oposicion_id: 10,
    tipo: 'plantilla_test',
    plantilla_test_id: 99,
    titulo: 'Nuevo test',
    fecha_inicio: '2026-06-01',
    fecha_fin: '2026-06-08',
  });
  assert.equal(result.id, 7);

  restore(snaps);
});

test('create — notifica alumnos si se publica directamente con notificar_alumnos=true', async () => {
  const snaps = snapshot(profesorAccessRepository, profesorWorkspacePlanificacionRepository, notificacionesRepository);
  let notificacionesEnviadas = 0;
  profesorAccessRepository.hasAssignedOposicion = async () => true;
  profesorWorkspacePlanificacionRepository.getDependencyOposicion = async () => ({ oposicion_id: 10 });
  profesorWorkspacePlanificacionRepository.create = async () => ({ id: 8 });
  profesorWorkspacePlanificacionRepository.replaceTemas = async () => {};
  profesorWorkspacePlanificacionRepository.getForProfesor = async () => ({
    ...BASE_ITEM, id: 8, estado: 'publicada', notificar_alumnos: true, notificada_en: null,
  });
  profesorWorkspacePlanificacionRepository.listActiveAlumnoIds = async () => [2, 3];
  profesorWorkspacePlanificacionRepository.markNotificada = async () => {};
  notificacionesRepository.crear = async () => { notificacionesEnviadas++; };

  await profesorWorkspacePlanificacionService.create(1, {
    oposicion_id: 10,
    tipo: 'plantilla_test',
    plantilla_test_id: 99,
    titulo: 'Nuevo test publicado',
    estado: 'publicada',
    notificar_alumnos: true,
    fecha_inicio: '2026-06-01',
    fecha_fin: '2026-06-08',
  });
  assert.equal(notificacionesEnviadas, 2, 'debe haber enviado 2 notificaciones (una por alumno)');

  restore(snaps);
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

test('update — modifica parcialmente y devuelve el item actualizado', async () => {
  const snaps = snapshot(profesorAccessRepository, profesorWorkspacePlanificacionRepository, notificacionesRepository);
  profesorWorkspacePlanificacionRepository.getForProfesor = async () => BASE_ITEM;
  profesorAccessRepository.hasAssignedOposicion = async () => true;
  profesorWorkspacePlanificacionRepository.getDependencyOposicion = async () => ({ oposicion_id: 10 });
  let updated;
  profesorWorkspacePlanificacionRepository.update = async (id, payload) => { updated = payload; };
  profesorWorkspacePlanificacionRepository.replaceTemas = async () => {};

  await profesorWorkspacePlanificacionService.update(1, 1, { titulo: 'Repaso actualizado' });
  assert.equal(updated.titulo, 'Repaso actualizado');

  restore(snaps);
});

// ---------------------------------------------------------------------------
// archive
// ---------------------------------------------------------------------------

test('archive — cambia estado a archivada', async () => {
  const snaps = snapshot(profesorWorkspacePlanificacionRepository);
  profesorWorkspacePlanificacionRepository.getForProfesor = async () => BASE_ITEM;
  let archivedId;
  profesorWorkspacePlanificacionRepository.archive = async (id) => { archivedId = id; };

  const result = await profesorWorkspacePlanificacionService.archive(1, 1);
  assert.equal(result.estado, 'archivada');
  assert.equal(archivedId, 1);

  restore(snaps);
});

// ---------------------------------------------------------------------------
// resultados
// ---------------------------------------------------------------------------

test('resultados — pagina correctamente los resultados', async () => {
  const snaps = snapshot(profesorWorkspacePlanificacionRepository);
  profesorWorkspacePlanificacionRepository.getForProfesor = async () => BASE_ITEM;
  profesorWorkspacePlanificacionRepository.listResultados = async () => ({
    items: [
      { alumno_id: 2, alumno_nombre: 'Ana', alumno_email: 'ana@test.com', intentos: 1, completados: 1, nota_media: 7.5, mejor_nota: 7.5, ultima_actividad: new Date(), ultimo_test_id: 50, ultimo_estado: 'finalizado', ultima_nota: 7.5, ultimos_aciertos: 8, ultimos_errores: 2, ultimos_blancos: 0, ultimo_tiempo_segundos: 300 },
    ],
    total: 1,
  });

  const result = await profesorWorkspacePlanificacionService.resultados(1, 1, { page: 1, page_size: 10 });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].alumnoNombre, 'Ana');
  assert.equal(result.items[0].estado, 'completado');
  assert.equal(result.pagination.total, 1);

  restore(snaps);
});

test('resultados — alumno con intentos pero sin completados tiene estado iniciado', async () => {
  const snaps = snapshot(profesorWorkspacePlanificacionRepository);
  profesorWorkspacePlanificacionRepository.getForProfesor = async () => BASE_ITEM;
  profesorWorkspacePlanificacionRepository.listResultados = async () => ({
    items: [
      { alumno_id: 3, alumno_nombre: 'Luis', alumno_email: 'luis@test.com', intentos: 2, completados: 0, nota_media: null, mejor_nota: null, ultima_actividad: new Date(), ultimo_test_id: null, ultimo_estado: 'en_curso', ultima_nota: null, ultimos_aciertos: null, ultimos_errores: null, ultimos_blancos: null, ultimo_tiempo_segundos: null },
    ],
    total: 1,
  });

  const result = await profesorWorkspacePlanificacionService.resultados(1, 1, {});
  assert.equal(result.items[0].estado, 'iniciado');

  restore(snaps);
});

test('resultados — alumno sin actividad tiene estado pendiente', async () => {
  const snaps = snapshot(profesorWorkspacePlanificacionRepository);
  profesorWorkspacePlanificacionRepository.getForProfesor = async () => BASE_ITEM;
  profesorWorkspacePlanificacionRepository.listResultados = async () => ({
    items: [
      { alumno_id: 4, alumno_nombre: 'Maria', alumno_email: 'maria@test.com', intentos: 0, completados: 0, nota_media: null, mejor_nota: null, ultima_actividad: null, ultimo_test_id: null, ultimo_estado: null, ultima_nota: null, ultimos_aciertos: null, ultimos_errores: null, ultimos_blancos: null, ultimo_tiempo_segundos: null },
    ],
    total: 1,
  });

  const result = await profesorWorkspacePlanificacionService.resultados(1, 1, {});
  assert.equal(result.items[0].estado, 'pendiente');

  restore(snaps);
});

// ---------------------------------------------------------------------------
// enviarRecordatorio
// ---------------------------------------------------------------------------

test('enviarRecordatorio — no envía si no hay alumnos pendientes', async () => {
  const snaps = snapshot(profesorWorkspacePlanificacionRepository, notificacionesRepository);
  profesorWorkspacePlanificacionRepository.getForProfesor = async () => BASE_ITEM;
  profesorWorkspacePlanificacionRepository.listAlumnoIdsPendientes = async () => [];
  let notified = false;
  notificacionesRepository.crear = async () => { notified = true; };

  const result = await profesorWorkspacePlanificacionService.enviarRecordatorio(1, 1);
  assert.equal(result.enviados, 0);
  assert.equal(notified, false);

  restore(snaps);
});

test('enviarRecordatorio — envía una notificación por alumno pendiente', async () => {
  const snaps = snapshot(profesorWorkspacePlanificacionRepository, notificacionesRepository);
  profesorWorkspacePlanificacionRepository.getForProfesor = async () => BASE_ITEM;
  profesorWorkspacePlanificacionRepository.listAlumnoIdsPendientes = async () => [2, 3, 4];
  let count = 0;
  notificacionesRepository.crear = async () => { count++; };

  const result = await profesorWorkspacePlanificacionService.enviarRecordatorio(1, 1);
  assert.equal(result.enviados, 3);
  assert.equal(count, 3);

  restore(snaps);
});
