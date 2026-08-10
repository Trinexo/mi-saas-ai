import test, { afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { albacerAlumnoRepository } from '../../src/repositories/albacerAlumno.repository.js';
import { accessContextService } from '../../src/services/accessContext.service.js';
import { albacerAlumnoService } from '../../src/services/albacerAlumno.service.js';
import { testContinuarService } from '../../src/services/testContinuar.service.js';

const original = {
  contexto: accessContextService.obtenerContextoUsuario,
  bulk: accessContextService.obtenerContextosUsuario,
  getAcceso: albacerAlumnoRepository.getAcceso,
  listModulos: albacerAlumnoRepository.listModulos,
  upsertModuloDisponible: albacerAlumnoRepository.upsertModuloDisponible,
  query: pool.query,
};

afterEach(() => {
  accessContextService.obtenerContextoUsuario = original.contexto;
  accessContextService.obtenerContextosUsuario = original.bulk;
  albacerAlumnoRepository.getAcceso = original.getAcceso;
  albacerAlumnoRepository.listModulos = original.listModulos;
  albacerAlumnoRepository.upsertModuloDisponible = original.upsertModuloDisponible;
  pool.query = original.query;
});

const context = (modo, puedeAcceder = true) => ({
  tiene_acceso: puedeAcceder,
  modo_activo: modo,
  permisos: {
    puede_acceder_contenido: puedeAcceder,
    puede_usar_guiado: puedeAcceder && modo === 'guiado',
    puede_usar_experto: puedeAcceder && modo === 'experto',
  },
});

describe('consumidores de acceso canonico', { concurrency: false }, () => {
  test('Albacer autoriza por contexto guiado y no por tipo_alumno', async () => {
    accessContextService.obtenerContextoUsuario = async () => context('guiado');
    albacerAlumnoRepository.getAcceso = async () => ({
      tipo_alumno: 'legacy-incompatible',
      modo_preparacion: 'albacer',
    });
    albacerAlumnoRepository.listModulos = async () => [];
    albacerAlumnoRepository.upsertModuloDisponible = async () => {};

    const result = await albacerAlumnoService.getEstado('7', '9223372036854775807');

    assert.equal(result.modo_preparacion, 'albacer');
    assert.equal(result.total_modulos, 0);
  });

  test('Albacer bloquea contexto experto aunque el legacy diga albacer', async () => {
    accessContextService.obtenerContextoUsuario = async () => context('experto');
    albacerAlumnoRepository.getAcceso = async () => ({ modo_preparacion: 'albacer' });

    await assert.rejects(
      () => albacerAlumnoService.getEstado('7', '21'),
      (error) => error.status === 403,
    );
  });

  test('testContinuar usa bulk y conserva un oposicionId BIGINT como string', async () => {
    const oposicionId = '9223372036854775807';
    accessContextService.obtenerContextosUsuario = async () => [{
      oposicion_id: oposicionId,
      permisos: { puede_acceder_contenido: true },
    }];
    const queries = [];
    pool.query = async (sql, params) => {
      queries.push({ sql, params });
      return { rows: [] };
    };

    const result = await testContinuarService.getContinuar('7', oposicionId);

    assert.equal(result.tipo, 'repaso');
    assert.equal(result.oposicionId, oposicionId);
    assert.equal(queries.length, 3);
    assert.equal(queries[0].params[1], oposicionId);
    assert.ok(queries.every(({ sql }) => /^\s*SELECT/i.test(sql)));
  });

  test('testContinuar devuelve inicio sin acceso y solo realiza lectura', async () => {
    accessContextService.obtenerContextosUsuario = async () => [];
    const queries = [];
    pool.query = async (sql) => {
      queries.push(sql);
      return { rows: [] };
    };

    const result = await testContinuarService.getContinuar('7');

    assert.equal(result.tipo, 'empezar');
    assert.equal(result.config, null);
    assert.equal(queries.length, 1);
  });
});
