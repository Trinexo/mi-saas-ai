import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { simulacrosPublicosService } from '../../src/services/simulacrosPublicos.service.js';
import { simulacrosPublicosRepository } from '../../src/repositories/simulacrosPublicos.repository.js';
import { accesoOposicionRepository } from '../../src/repositories/accesoOposicion.repository.js';
import pool from '../../src/config/db.js';
import { accessContextService } from '../../src/services/accessContext.service.js';
import { testGenerationGeneratePersistenceService } from '../../src/services/testGenerationGeneratePersistence.service.js';

const originalGetAccesosActivos = accesoOposicionRepository.getAccesosActivos;
const originalGetPublicados = simulacrosPublicosRepository.getPublicados;
const originalQuery = pool.query;
const originalContextos = accessContextService.obtenerContextosUsuario;
const originalGetPreguntas = simulacrosPublicosRepository.getPreguntasSimulacro;
const originalPersist = testGenerationGeneratePersistenceService.persistAndBuildResponse;

afterEach(() => {
  accesoOposicionRepository.getAccesosActivos = originalGetAccesosActivos;
  simulacrosPublicosRepository.getPublicados = originalGetPublicados;
  pool.query = originalQuery;
  accessContextService.obtenerContextosUsuario = originalContextos;
  simulacrosPublicosRepository.getPreguntasSimulacro = originalGetPreguntas;
  testGenerationGeneratePersistenceService.persistAndBuildResponse = originalPersist;
});

describe('simulacrosPublicosService.getPublicados', () => {
  it('filtra por oposicion activa cuando se recibe oposicion_id', async () => {
    let receivedIds = null;
    accessContextService.obtenerContextosUsuario = async () => [
      { oposicion_id: 10, tipo_alumno: 'albacer', modo_activo: 'guiado', modelos_disponibles: ['guiado'], permisos: { puede_acceder_contenido: true } },
      { oposicion_id: 20, tipo_alumno: 'albacer', modo_activo: 'guiado', modelos_disponibles: ['guiado'], permisos: { puede_acceder_contenido: true } },
    ];
    simulacrosPublicosRepository.getPublicados = async (oposicionIds) => {
      receivedIds = oposicionIds;
      return [];
    };

    await simulacrosPublicosService.getPublicados(1, 20);

    assert.deepEqual(receivedIds, [20]);
  });

  it('devuelve lista vacia si la oposicion solicitada no esta activa para el usuario', async () => {
    let receivedIds = null;
    accessContextService.obtenerContextosUsuario = async () => [{ oposicion_id: 10, tipo_alumno: 'albacer', modo_activo: 'guiado', modelos_disponibles: ['guiado'], permisos: { puede_acceder_contenido: true } }];
    simulacrosPublicosRepository.getPublicados = async (oposicionIds) => {
      receivedIds = oposicionIds;
      return [];
    };

    await simulacrosPublicosService.getPublicados(1, 99);

    assert.deepEqual(receivedIds, []);
  });

  it('excluye simulacros para accesos libres aunque tengan modelos autorizados', async () => {
    let receivedIds = null;
    accessContextService.obtenerContextosUsuario = async () => [
      { oposicion_id: 10, tipo_alumno: 'libre', modo_activo: 'experto', modelos_disponibles: ['experto'], permisos: { puede_acceder_contenido: true } },
      { oposicion_id: 20, tipo_alumno: 'albacer', modo_activo: 'experto', modelos_disponibles: ['experto', 'guiado'], permisos: { puede_acceder_contenido: true } },
    ];
    simulacrosPublicosRepository.getPublicados = async (oposicionIds) => {
      receivedIds = oposicionIds;
      return [];
    };

    await simulacrosPublicosService.getPublicados(1);

    assert.deepEqual(receivedIds, [20]);
  });

  it('mantiene visibles los simulacros con ambos modelos cuando el modo activo es experto', async () => {
    let receivedIds = null;
    accessContextService.obtenerContextosUsuario = async () => [{
      oposicion_id: 20,
      tipo_alumno: 'albacer',
      modo_activo: 'experto',
      modelos_disponibles: ['experto', 'guiado'],
      permisos: { puede_acceder_contenido: true },
    }];
    simulacrosPublicosRepository.getPublicados = async (oposicionIds) => {
      receivedIds = oposicionIds;
      return ['simulacro'];
    };

    assert.deepEqual(await simulacrosPublicosService.getPublicados(1, 20), ['simulacro']);
    assert.deepEqual(receivedIds, [20]);
  });

  it('mantiene visibles los simulacros con ambos modelos cuando el modo activo es guiado', async () => {
    let receivedIds = null;
    accessContextService.obtenerContextosUsuario = async () => [{
      oposicion_id: 20,
      tipo_alumno: 'albacer',
      modo_activo: 'guiado',
      modelos_disponibles: ['experto', 'guiado'],
      permisos: { puede_acceder_contenido: true },
    }];
    simulacrosPublicosRepository.getPublicados = async (oposicionIds) => {
      receivedIds = oposicionIds;
      return ['simulacro'];
    };

    assert.deepEqual(await simulacrosPublicosService.getPublicados(1, 20), ['simulacro']);
    assert.deepEqual(receivedIds, [20]);
  });

  it('autoriza por tipo de alumno del acceso, sin depender de modelos ni modo activo', async () => {
    const casos = [
      { tipo_alumno: 'libre', modelos_disponibles: ['experto'], modo_activo: 'experto', visible: false },
      { tipo_alumno: 'libre', modelos_disponibles: ['guiado'], modo_activo: 'guiado', visible: false },
      { tipo_alumno: 'libre', modelos_disponibles: ['experto', 'guiado'], modo_activo: 'experto', visible: false },
      { tipo_alumno: 'libre', modelos_disponibles: ['experto', 'guiado'], modo_activo: 'guiado', visible: false },
      { tipo_alumno: 'albacer', modelos_disponibles: ['guiado'], modo_activo: 'guiado', visible: true },
      { tipo_alumno: 'albacer', modelos_disponibles: ['experto', 'guiado'], modo_activo: 'guiado', visible: true },
      { tipo_alumno: 'albacer', modelos_disponibles: ['experto', 'guiado'], modo_activo: 'experto', visible: true },
      { tipo_alumno: 'albacer', modelos_disponibles: ['experto'], modo_activo: 'experto', visible: true },
      { tipo_alumno: 'albacer', modelos_disponibles: ['experto'], modo_activo: 'guiado', visible: true },
    ];
    for (const caso of casos) {
      let receivedIds = null;
      accessContextService.obtenerContextosUsuario = async () => [{
        oposicion_id: 20,
        ...caso,
        permisos: { puede_acceder_contenido: true },
      }];
      simulacrosPublicosRepository.getPublicados = async (oposicionIds) => {
        receivedIds = oposicionIds;
        return oposicionIds.length > 0 ? ['simulacro'] : [];
      };

      const result = await simulacrosPublicosService.getPublicados(1, 20);
      assert.deepEqual(result, caso.visible ? ['simulacro'] : []);
      assert.deepEqual(receivedIds, caso.visible ? [20] : []);
    }
  });

  it('permite iniciar con ambos modelos aunque el modo activo sea experto', async () => {
    accessContextService.obtenerContextoUsuario = async () => ({
      oposicion_id: 20,
      tipo_alumno: 'albacer',
      modo_activo: 'experto',
      modelos_disponibles: ['experto', 'guiado'],
      permisos: { puede_acceder_contenido: true },
    });
    simulacrosPublicosRepository.getPreguntasSimulacro = async () => ({
      simulacro: { id: '8', oposicion_id: '20', tiempo_limite_segundos: 60 },
      preguntas: [{ id: '9', enunciado: 'Pregunta', nivel_dificultad: 'media', opciones: [] }],
    });
    testGenerationGeneratePersistenceService.persistAndBuildResponse = async (payload) => payload;

    const result = await simulacrosPublicosService.iniciarSimulacroPublicado(1, '8');
    assert.equal(result.oposicionId, '20');
  });

  it('permite iniciar a Albacer con solo modelo experto', async () => {
    accessContextService.obtenerContextoUsuario = async () => ({
      oposicion_id: 20,
      tipo_alumno: 'albacer',
      modo_activo: 'experto',
      modelos_disponibles: ['experto'],
      permisos: { puede_acceder_contenido: true },
    });
    simulacrosPublicosRepository.getPreguntasSimulacro = async () => ({
      simulacro: { id: '8', oposicion_id: '20', tiempo_limite_segundos: 60 },
      preguntas: [{ id: '9', enunciado: 'Pregunta', nivel_dificultad: 'media', opciones: [] }],
    });
    testGenerationGeneratePersistenceService.persistAndBuildResponse = async (payload) => payload;

    const result = await simulacrosPublicosService.iniciarSimulacroPublicado(1, '8');
    assert.equal(result.oposicionId, '20');
  });

  it('bloquea iniciar a un alumno libre aunque se manipule el ID', async () => {
    accessContextService.obtenerContextoUsuario = async () => ({
      oposicion_id: 20,
      tipo_alumno: 'libre',
      modo_activo: 'experto',
      modelos_disponibles: ['experto'],
      permisos: { puede_acceder_contenido: true },
    });
    simulacrosPublicosRepository.getPreguntasSimulacro = async () => ({
      simulacro: { id: '8', oposicion_id: '20', tiempo_limite_segundos: 60 },
      preguntas: [{ id: '9', enunciado: 'Pregunta', nivel_dificultad: 'media', opciones: [] }],
    });

    await assert.rejects(
      () => simulacrosPublicosService.iniciarSimulacroPublicado(1, '8'),
      { status: 403 },
    );
  });
});

describe('simulacrosPublicosRepository', () => {
  it('excluye simulacros finales de modulo Albacer del listado publico', async () => {
    let receivedSql = '';
    pool.query = async (sql) => {
      receivedSql = sql;
      return { rows: [] };
    };

    await simulacrosPublicosRepository.getPublicados([10]);

    assert.match(receivedSql, /COALESCE\(s\.scope, 'experto'\) <> 'albacer_modulo_final'/);
  });
});
