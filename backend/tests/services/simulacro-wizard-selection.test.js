import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { profesorWorkspaceSeleccionService } from '../../src/services/profesorWorkspaceSeleccion.service.js';
import { profesorWorkspaceSeleccionRepository } from '../../src/repositories/profesorWorkspaceSeleccion.repository.js';
import { profesorAccessRepository } from '../../src/repositories/profesorAccess.repository.js';
import { seleccionPreguntasSchema } from '../../src/schemas/profesorWorkspace.schema.js';
import { adminSimulacrosService } from '../../src/services/adminSimulacros.service.js';
import { adminSimulacrosRepository } from '../../src/repositories/adminSimulacros.repository.js';

test('payload del wizard con dos temas, total 2 y dificultad mixta se normaliza sin filtro', () => {
  const payload = {
    oposicion_id: '8', tema_ids: ['1', '2'], cantidad: '2', dificultad: null,
    officialidad: 'all', anio_ids: [], examen_id: null, simulacro_id: '123',
    exclude_ids: [], reparto_por_tema: false,
    permitir_completar_con_otros_temas: false,
  };
  const parsed = seleccionPreguntasSchema.parse(payload);
  assert.deepEqual(parsed.tema_ids, [1, 2]);
  assert.equal(parsed.cantidad, 2);
  assert.equal(parsed.dificultad, null);
  assert.equal(parsed.officialidad, 'all');
});

test('seleccion simplificada sin reparto devuelve una sola seleccion exacta', async () => {
  const originalAccess = profesorAccessRepository.hasAssignedOposicion;
  const originalList = profesorWorkspaceSeleccionRepository.listPreguntasDisponibles;
  const originalTopics = profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion;
  const originalTopicNames = profesorWorkspaceSeleccionRepository.listTemasInOposicion;
  const originalPlantilla = profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla;
  const originalSimulacro = profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro;
  try {
    profesorAccessRepository.hasAssignedOposicion = async () => true;
    profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion = async (_, ids) => ids.map(Number);
    profesorWorkspaceSeleccionRepository.listTemasInOposicion = async (_, ids) => ids.map((id) => ({ id, nombre: `Tema ${id}` }));
    profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla = async () => [];
    profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro = async () => [];
    profesorWorkspaceSeleccionRepository.listPreguntasDisponibles = async ({ temaId }) => [
      { id: `${temaId}01`, tema_id: temaId, tema_nombre: `Tema ${temaId}` },
      { id: `${temaId}02`, tema_id: temaId, tema_nombre: `Tema ${temaId}` },
    ];
    const result = await profesorWorkspaceSeleccionService.seleccionar('7', {
      oposicion_id: '8', tema_ids: ['1', '2'], cantidad: 3,
      dificultad: null, officialidad: 'all', anio_ids: [], examen_id: null,
      exclude_ids: [], reparto_por_tema: false, simulacro_id: null,
    });
    assert.equal(result.total_seleccionadas, 3);
    assert.equal(result.preguntas.length, 3);
    assert.deepEqual(result.avisos, []);
  } finally {
    profesorAccessRepository.hasAssignedOposicion = originalAccess;
    profesorWorkspaceSeleccionRepository.listPreguntasDisponibles = originalList;
    profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion = originalTopics;
    profesorWorkspaceSeleccionRepository.listTemasInOposicion = originalTopicNames;
    profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla = originalPlantilla;
    profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro = originalSimulacro;
  }
});

test('seleccion simplificada rechaza si no hay suficientes preguntas', async () => {
  const originalAccess = profesorAccessRepository.hasAssignedOposicion;
  const originalList = profesorWorkspaceSeleccionRepository.listPreguntasDisponibles;
  const originalTopics = profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion;
  const originalTopicNames = profesorWorkspaceSeleccionRepository.listTemasInOposicion;
  const originalPlantilla = profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla;
  const originalSimulacro = profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro;
  try {
    profesorAccessRepository.hasAssignedOposicion = async () => true;
    profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion = async (_, ids) => ids.map(Number);
    profesorWorkspaceSeleccionRepository.listTemasInOposicion = async (_, ids) => ids.map((id) => ({ id, nombre: `Tema ${id}` }));
    profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla = async () => [];
    profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro = async () => [];
    profesorWorkspaceSeleccionRepository.listPreguntasDisponibles = async () => [];
    const result = await profesorWorkspaceSeleccionService.seleccionar('7', {
      oposicion_id: '8', tema_ids: ['1'], cantidad: 2,
      dificultad: null, officialidad: 'all', anio_ids: [], examen_id: null,
      exclude_ids: [], reparto_por_tema: false, simulacro_id: null,
    });
    assert.equal(result.total_seleccionadas, 0);
    assert.match(result.avisos[0].mensaje, /Necesitas 2 preguntas y hay 0/);
  } finally {
    profesorAccessRepository.hasAssignedOposicion = originalAccess;
    profesorWorkspaceSeleccionRepository.listPreguntasDisponibles = originalList;
    profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion = originalTopics;
    profesorWorkspaceSeleccionRepository.listTemasInOposicion = originalTopicNames;
    profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla = originalPlantilla;
    profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro = originalSimulacro;
  }
});

test('sin reparto combina los temas y no exige una pregunta por tema', async () => {
  const originals = {
    access: profesorAccessRepository.hasAssignedOposicion,
    topics: profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion,
    names: profesorWorkspaceSeleccionRepository.listTemasInOposicion,
    list: profesorWorkspaceSeleccionRepository.listPreguntasDisponibles,
    plantilla: profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla,
    simulacro: profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro,
  };
  try {
    profesorAccessRepository.hasAssignedOposicion = async () => true;
    profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion = async (_, ids) => ids.map(Number);
    profesorWorkspaceSeleccionRepository.listTemasInOposicion = async () => [{ id: 6, nombre: 'Tema A' }, { id: 7, nombre: 'Tema B' }];
    profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla = async () => [];
    profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro = async () => [];
    profesorWorkspaceSeleccionRepository.listPreguntasDisponibles = async ({ temaId }) => temaId === 6
      ? [{ id: '601', tema_id: 6, tema_nombre: 'Tema A' }, { id: '602', tema_id: 6, tema_nombre: 'Tema A' }]
      : [];
    const result = await profesorWorkspaceSeleccionService.seleccionar('7', {
      oposicion_id: 8, tema_ids: [6, 7], cantidad: 2, dificultad: null,
      officialidad: 'all', anio_ids: [], examen_id: null, exclude_ids: [],
      reparto_por_tema: false, simulacro_id: null,
    });
    assert.equal(result.total_seleccionadas, 2);
    assert.deepEqual(result.avisos, []);
  } finally {
    profesorAccessRepository.hasAssignedOposicion = originals.access;
    profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion = originals.topics;
    profesorWorkspaceSeleccionRepository.listTemasInOposicion = originals.names;
    profesorWorkspaceSeleccionRepository.listPreguntasDisponibles = originals.list;
    profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla = originals.plantilla;
    profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro = originals.simulacro;
  }
});

test('sin reparto comunica una insuficiencia global sin exponer IDs de temas', async () => {
  const originals = {
    access: profesorAccessRepository.hasAssignedOposicion,
    topics: profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion,
    names: profesorWorkspaceSeleccionRepository.listTemasInOposicion,
    list: profesorWorkspaceSeleccionRepository.listPreguntasDisponibles,
    plantilla: profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla,
    simulacro: profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro,
  };
  try {
    profesorAccessRepository.hasAssignedOposicion = async () => true;
    profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion = async (_, ids) => ids.map(Number);
    profesorWorkspaceSeleccionRepository.listTemasInOposicion = async () => [{ id: 6, nombre: 'Tema A' }, { id: 7, nombre: 'Tema B' }];
    profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla = async () => [];
    profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro = async () => [];
    profesorWorkspaceSeleccionRepository.listPreguntasDisponibles = async () => [{ id: '601', tema_id: 6, tema_nombre: 'Tema A' }];
    const result = await profesorWorkspaceSeleccionService.seleccionar('7', {
      oposicion_id: 8, tema_ids: [6, 7], cantidad: 2, dificultad: null,
      officialidad: 'all', anio_ids: [], examen_id: null, exclude_ids: [],
      reparto_por_tema: false, simulacro_id: null,
    });
    assert.equal(result.total_seleccionadas, 1);
    assert.match(result.avisos[0].mensaje, /Necesitas 2 preguntas y hay 1/);
    assert.doesNotMatch(result.avisos[0].mensaje, /6|7/);
  } finally {
    profesorAccessRepository.hasAssignedOposicion = originals.access;
    profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion = originals.topics;
    profesorWorkspaceSeleccionRepository.listTemasInOposicion = originals.names;
    profesorWorkspaceSeleccionRepository.listPreguntasDisponibles = originals.list;
    profesorWorkspaceSeleccionRepository.getPreguntasByPlantilla = originals.plantilla;
    profesorWorkspaceSeleccionRepository.getPreguntasBySimulacro = originals.simulacro;
  }
});

test('con reparto los mensajes usan el nombre del tema', async () => {
  const originals = {
    access: profesorAccessRepository.hasAssignedOposicion,
    topics: profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion,
    names: profesorWorkspaceSeleccionRepository.listTemasInOposicion,
    list: profesorWorkspaceSeleccionRepository.listPreguntasDisponibles,
    count: profesorWorkspaceSeleccionRepository.countDisponibles,
  };
  try {
    profesorAccessRepository.hasAssignedOposicion = async () => true;
    profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion = async (_, ids) => ids.map(Number);
    profesorWorkspaceSeleccionRepository.listTemasInOposicion = async () => [{ id: 6, nombre: 'Tema A' }, { id: 7, nombre: 'Tema B' }];
    profesorWorkspaceSeleccionRepository.listPreguntasDisponibles = async ({ temaId }) => temaId === 6
      ? [{ id: '601', tema_id: 6, tema_nombre: 'Tema A' }] : [];
    profesorWorkspaceSeleccionRepository.countDisponibles = async ({ temaId }) => temaId === 6 ? 1 : 0;
    const result = await profesorWorkspaceSeleccionService.seleccionar('7', {
      oposicion_id: 8, tema_ids: [6, 7], cantidad: 2, dificultad: null,
      officialidad: 'all', anio_ids: [], examen_id: null, exclude_ids: [],
      reparto_por_tema: true, temas: [{ tema_id: 6, cantidad: 1 }, { tema_id: 7, cantidad: 1 }],
      simulacro_id: null,
    });
    assert.match(result.avisos[0].mensaje, /Tema B/);
    assert.doesNotMatch(result.avisos[0].mensaje, /tema 7/i);
  } finally {
    profesorAccessRepository.hasAssignedOposicion = originals.access;
    profesorWorkspaceSeleccionRepository.listTemaIdsInOposicion = originals.topics;
    profesorWorkspaceSeleccionRepository.listTemasInOposicion = originals.names;
    profesorWorkspaceSeleccionRepository.listPreguntasDisponibles = originals.list;
    profesorWorkspaceSeleccionRepository.countDisponibles = originals.count;
  }
});

test('gestor simplificado rechaza una pregunta de un tema no configurado', async () => {
  const original = adminSimulacrosRepository.getPreguntasForAssignmentValidation;
  try {
    adminSimulacrosRepository.getPreguntasForAssignmentValidation = async () => [{
      id: '9001', tema_id: '3', estado: 'aprobada', oposicion_id: '8',
      nivel_dificultad: 'media', es_oficial: false,
      coincide_anio: false, coincide_examen: false, tema_configurado: false,
    }];
    await assert.rejects(
      () => adminSimulacrosService.assertPreguntasWithinConfiguration(
        { id: '77', oposicion_id: '8', configuracion_preguntas: {
          temas: [{ tema_id: 1, cantidad: null }, { tema_id: 2, cantidad: null }],
          dificultad: null, officialidad: 'all', reparto_por_tema: false,
        } },
        '88', ['9001'],
      ),
      /temas configurados/,
    );
  } finally {
    adminSimulacrosRepository.getPreguntasForAssignmentValidation = original;
  }
});

test('la oposicion de una pregunta se deriva de temas, no de preguntas.oposicion_id', () => {
  const schema = readFileSync(new URL('../../../database/schema.sql', import.meta.url), 'utf8');
  const preguntasTable = schema.match(/CREATE TABLE IF NOT EXISTS preguntas \([\s\S]*?\n\);/i)?.[0] ?? '';
  assert.match(preguntasTable, /tema_id BIGINT NOT NULL REFERENCES temas\(id\)/i);
  assert.doesNotMatch(preguntasTable, /oposicion_id/i);
});

test('gestor simplificado mantiene filtros editoriales y límites de reparto', async () => {
  const originals = {
    validation: adminSimulacrosRepository.getPreguntasForAssignmentValidation,
    current: adminSimulacrosRepository.getBloquePreguntaIds,
    topics: adminSimulacrosRepository.getPreguntaTopicIds,
  };
  try {
    adminSimulacrosRepository.getPreguntasForAssignmentValidation = async () => [{
      id: '9002', tema_id: '1', estado: 'aprobada', oposicion_id: '8',
      nivel_dificultad: 'facil', es_oficial: true,
      coincide_anio: true, coincide_examen: true, tema_configurado: true,
    }];
    adminSimulacrosRepository.getBloquePreguntaIds = async () => [];
    adminSimulacrosRepository.getPreguntaTopicIds = async () => [{ id: '9002', tema_id: '1' }];
    await assert.doesNotReject(() => adminSimulacrosService.assertPreguntasWithinConfiguration(
      { id: '77', oposicion_id: '8', configuracion_preguntas: {
        temas: [{ tema_id: 1, cantidad: 1 }], dificultad: 'facil', officialidad: 'official',
        anio_ids: [2024], examen_id: 55, reparto_por_tema: true,
      } },
      '88', ['9002'],
    ));
    adminSimulacrosRepository.getPreguntaTopicIds = async () => [
      { id: '9002', tema_id: '1' }, { id: '9003', tema_id: '1' },
    ];
    await assert.rejects(
      () => adminSimulacrosService.assertPreguntasWithinConfiguration(
        { id: '77', oposicion_id: '8', configuracion_preguntas: {
          temas: [{ tema_id: 1, cantidad: 1 }], dificultad: 'facil', officialidad: 'official',
          anio_ids: [2024], examen_id: 55, reparto_por_tema: true,
        } },
        '88', ['9002'],
      ),
      /reparto configurado/,
    );
  } finally {
    adminSimulacrosRepository.getPreguntasForAssignmentValidation = originals.validation;
    adminSimulacrosRepository.getBloquePreguntaIds = originals.current;
    adminSimulacrosRepository.getPreguntaTopicIds = originals.topics;
  }
});
