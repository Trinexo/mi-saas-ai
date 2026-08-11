import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  actividadFeedQuerySchema,
  planificacionIdParamSchema,
  preguntasProblematicasQuerySchema,
  workspaceAlumnosQuerySchema,
  workspaceListQuerySchema,
} from '../../src/schemas/profesorWorkspace.schema.js';
import {
  contextoEsOperativo,
  createAccessContextService,
} from '../../src/services/accessContext.service.js';
import { accessContextService } from '../../src/services/accessContext.service.js';
import { profesorWorkspaceAnalyticsService } from '../../src/services/profesorWorkspaceAnalytics.service.js';

const NOW = new Date('2026-08-11T12:00:00.000Z');

const contexto = (estadoEfectivo, overrides = {}) => ({
  tiene_acceso: true,
  estado_efectivo: estadoEfectivo,
  vigencia: {
    fecha_inicio: '2026-08-01T00:00:00.000Z',
    fecha_fin: '2026-09-01T00:00:00.000Z',
    esta_vigente: estadoEfectivo === 'activo',
    dias_restantes: 21,
  },
  ...overrides,
});

test('workspaceListQuerySchema normaliza filtros paginados', () => {
  const result = workspaceListQuerySchema.parse({
    oposicion_id: '12',
    dias: '30',
    page: '2',
    page_size: '50',
  });

  assert.equal(result.oposicion_id, 12);
  assert.equal(result.dias, 30);
  assert.equal(result.page, 2);
  assert.equal(result.page_size, 50);
});

test('workspaceAlumnosQuerySchema mantiene filtros textuales y normaliza ids', () => {
  const result = workspaceAlumnosQuerySchema.parse({
    oposicion_id: '7',
    q: 'ana',
    estado: 'activo',
  });

  assert.equal(result.oposicion_id, 7);
  assert.equal(result.q, 'ana');
  assert.equal(result.estado, 'activo');
});

test('preguntasProblematicasQuerySchema normaliza tema_id', () => {
  const result = preguntasProblematicasQuerySchema.parse({
    oposicion_id: '3',
    tema_id: '9',
  });

  assert.equal(result.oposicion_id, 3);
  assert.equal(result.tema_id, 9);
});

test('actividadFeedQuerySchema normaliza alumno_id y valida tipo', () => {
  const result = actividadFeedQuerySchema.parse({
    alumno_id: '15',
    tipo: 'reporte',
  });

  assert.equal(result.alumno_id, 15);
  assert.equal(result.tipo, 'reporte');
});

test('planificacionIdParamSchema normaliza id', () => {
  const result = planificacionIdParamSchema.parse({ id: '8' });
  assert.deepEqual(result, { id: 8 });
});

test('schemas del workspace profesor rechazan valores invalidos', () => {
  assert.equal(workspaceListQuerySchema.safeParse({ oposicion_id: '0' }).success, false);
  assert.equal(workspaceListQuerySchema.safeParse({ dias: '3' }).success, false);
  assert.equal(workspaceListQuerySchema.safeParse({ page_size: '500' }).success, false);
  assert.equal(actividadFeedQuerySchema.safeParse({ tipo: 'login' }).success, false);
  assert.equal(planificacionIdParamSchema.safeParse({ id: 'abc' }).success, false);
});

test('listOposiciones del workspace profesor usa agregaciones por CTE', () => {
  const repositoryPath = fileURLToPath(new URL('../../src/repositories/profesorWorkspaceAnalytics.repository.js', import.meta.url));
  const source = readFileSync(repositoryPath, 'utf8');
  const listOposicionesBody = source.slice(source.indexOf('async listOposiciones'), source.indexOf('async getDashboardKpis'));

  assert.match(listOposicionesBody, /WITH assigned AS/);
  assert.match(listOposicionesBody, /temas_count AS/);
  assert.match(listOposicionesBody, /preguntas_count AS/);
  assert.match(listOposicionesBody, /resultados AS/);
  assert.doesNotMatch(listOposicionesBody, /LEFT JOIN preguntas p[\s\S]*LEFT JOIN admin_tests at[\s\S]*LEFT JOIN simulacros s[\s\S]*LEFT JOIN accesos_oposicion ao[\s\S]*LEFT JOIN tests t/);
});

test('la política operativa distingue estados, fechas futuras y pendiente_modo', () => {
  assert.equal(contextoEsOperativo(contexto('activo')), true);
  assert.equal(contextoEsOperativo(contexto('activo', {
    vigencia: { ...contexto('activo').vigencia, esta_vigente: false },
  })), false);
  assert.equal(contextoEsOperativo(contexto('expirado')), false);
  assert.equal(contextoEsOperativo(contexto('revocado')), false);
  assert.equal(contextoEsOperativo(contexto('cancelado')), false);
  assert.equal(contextoEsOperativo(contexto('pendiente_modo')), false);
  assert.equal(contextoEsOperativo(contexto('pendiente_modo'), { permitirPendiente: true }), true);
  assert.equal(contextoEsOperativo(contexto('activo', {
    vigencia: {
      fecha_inicio: '2026-08-12T00:00:00.000Z',
      fecha_fin: '2026-09-01T00:00:00.000Z',
      esta_vigente: false,
    },
  })), false);
});

test('el helper bulk hace una lectura por oposición, conserva BIGINT y no escribe', async () => {
  const maxBigInt = '9223372036854775807';
  const calls = [];
  const service = createAccessContextService({
    clock: () => NOW,
    accesoRepository: {
      async obtenerLecturasContextosUsuariosOposicion(usuarioIds, oposicionId) {
        calls.push({ usuarioIds, oposicionId });
        return [{
          usuario_id: maxBigInt,
          usuario_existe: true,
          oposicion_existe: true,
          acceso_id: maxBigInt,
          estado: 'activo',
          modo_activo: 'experto',
          modo_preparacion: 'experto',
          fecha_inicio: '2026-08-01 00:00:00',
          fecha_fin: '2026-09-01 00:00:00',
          modelos: ['experto'],
        }];
      },
    },
  });

  const result = await service.obtenerContextosUsuariosOposicion({
    usuarioIds: [maxBigInt, maxBigInt],
    oposicionId: '12',
    principal: { tipo: 'profesor', usuarioId: '7' },
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], { usuarioIds: [maxBigInt], oposicionId: 12 });
  assert.equal(result.length, 1);
  assert.equal(result[0].usuario_id, maxBigInt);
  assert.equal(result[0].acceso_id, maxBigInt);
  assert.equal(result[0].estado_efectivo, 'activo');
  assert.equal(result[0].vigencia.esta_vigente, true);
});

test('el helper bulk falla cerrado ante una incoherencia canónica', async () => {
  const service = createAccessContextService({
    accesoRepository: {
      async obtenerLecturasContextosUsuariosOposicion() {
        return [{
          usuario_id: '8',
          usuario_existe: true,
          oposicion_existe: true,
          acceso_id: '9',
          estado: 'activo',
          modo_activo: 'guiado',
          modo_preparacion: 'albacer',
          fecha_inicio: '2026-08-01 00:00:00',
          fecha_fin: '2026-09-01 00:00:00',
          modelos: ['experto'],
        }];
      },
    },
  });

  await assert.rejects(
    service.obtenerContextosUsuariosOposicion({
      usuarioIds: ['8'],
      oposicionId: '12',
      principal: { tipo: 'profesor', usuarioId: '7' },
    }),
    (error) => error.code === 'ACCESS_CONTEXT_INCONSISTENT',
  );
});

test('los esquemas de workspace conservan BIGINT grande sin pérdida', () => {
  const maxBigInt = '9223372036854775807';
  const aboveMax = '9223372036854775808';
  const parsed = workspaceListQuerySchema.parse({ oposicion_id: maxBigInt });
  assert.equal(parsed.oposicion_id, maxBigInt);
  assert.equal(workspaceListQuerySchema.safeParse({ oposicion_id: aboveMax }).success, false);
});

test('la canonización bulk del workspace excluye accesos no operativos sin N+1', async () => {
  const original = accessContextService.obtenerContextosUsuariosOposicion;
  const calls = [];
  accessContextService.obtenerContextosUsuariosOposicion = async ({ usuarioIds, oposicionId }) => {
    calls.push({ usuarioIds, oposicionId });
    return [
      { usuario_id: 1, oposicion_id: 10, estado_efectivo: 'activo', tiene_acceso: true, vigencia: { esta_vigente: true } },
      { usuario_id: 2, oposicion_id: 10, estado_efectivo: 'pendiente_modo', tiene_acceso: true, vigencia: { fecha_inicio: '2026-08-01T00:00:00.000Z', fecha_fin: '2026-09-01T00:00:00.000Z' } },
      { usuario_id: 3, oposicion_id: 10, estado_efectivo: 'expirado', tiene_acceso: true, vigencia: { esta_vigente: false } },
      { usuario_id: 4, oposicion_id: 10, estado_efectivo: 'revocado', tiene_acceso: true, vigencia: { esta_vigente: false } },
      { usuario_id: 5, oposicion_id: 10, estado_efectivo: 'cancelado', tiene_acceso: true, vigencia: { esta_vigente: false } },
      { usuario_id: 6, oposicion_id: 10, estado_efectivo: 'activo', tiene_acceso: true, vigencia: { esta_vigente: false } },
    ];
  };
  const rows = [1, 2, 3, 4, 5, 6].map((id) => ({
    id,
    acceso_oposicion_ids: [10],
    oposiciones: [{ id: 10, nombre: 'Oposición' }],
  }));

  try {
    const visible = await profesorWorkspaceAnalyticsService.canonicalizeAlumnos(99, rows);
    assert.deepEqual(visible.map((row) => row.id), [1, 2]);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { usuarioIds: [1, 2, 3, 4, 5, 6], oposicionId: 10 });
  } finally {
    accessContextService.obtenerContextosUsuariosOposicion = original;
  }
});

test('detalle y estadísticas reutilizan la canonización de alumnos', () => {
  const servicePath = fileURLToPath(new URL('../../src/services/profesorWorkspaceAnalytics.service.js', import.meta.url));
  const source = readFileSync(servicePath, 'utf8');
  const detail = source.slice(source.indexOf('async oposicionDetalle'), source.indexOf('async temario'));
  const stats = source.slice(source.indexOf('async estadisticas'), source.indexOf('async preguntasProblematicas'));
  assert.match(detail, /canonicalizeAlumnos\(userId, alumnos\.items\)/);
  assert.match(stats, /canonicalizeAlumnos\(userId, alumnos\.items\)/);
});
