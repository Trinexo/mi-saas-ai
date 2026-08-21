import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { adminRepository } from '../../src/repositories/admin.repository.js';
import { profesorAccessRepository } from '../../src/repositories/profesorAccess.repository.js';
import { updatePreguntaSchema } from '../../src/schemas/admin.schema.js';
import { adminPreguntasCrudWriteMutationUpdateDeleteService } from '../../src/services/adminPreguntasCrudWriteMutationUpdateDelete.service.js';

const payload = (estado) => ({
  temaId: 10,
  enunciado: 'Pregunta de prueba suficientemente larga',
  explicacion: '',
  referenciaNormativa: null,
  nivelDificultad: 'media',
  estado,
  opciones: [
    { texto: 'Correcta', correcta: true },
    { texto: 'Incorrecta', correcta: false },
  ],
});

const setup = ({ assigned = true, targetAssigned = true } = {}) => {
  const original = {
    connect: pool.connect,
    getPreguntaById: adminRepository.getPreguntaById,
    updatePregunta: adminRepository.updatePregunta,
    updateOpciones: adminRepository.updateOpciones,
    insertAuditoria: adminRepository.insertAuditoria,
    hasAssignedPregunta: profesorAccessRepository.hasAssignedPregunta,
    hasAssignedTema: profesorAccessRepository.hasAssignedTema,
  };
  const calls = [];
  const client = {
    async query(sql) {
      calls.push(sql);
      return { rows: [] };
    },
    release() {},
  };
  pool.connect = async () => client;
  adminRepository.getPreguntaById = async () => ({ id: '100' });
  adminRepository.updatePregunta = async () => {};
  adminRepository.updateOpciones = async () => {};
  adminRepository.insertAuditoria = async () => {};
  profesorAccessRepository.hasAssignedPregunta = async () => assigned;
  profesorAccessRepository.hasAssignedTema = async () => targetAssigned;
  return { original, calls };
};

const restore = (original) => {
  pool.connect = original.connect;
  adminRepository.getPreguntaById = original.getPreguntaById;
  adminRepository.updatePregunta = original.updatePregunta;
  adminRepository.updateOpciones = original.updateOpciones;
  adminRepository.insertAuditoria = original.insertAuditoria;
  profesorAccessRepository.hasAssignedPregunta = original.hasAssignedPregunta;
  profesorAccessRepository.hasAssignedTema = original.hasAssignedTema;
};

test('profesor asignado puede recorrer las transiciones editoriales vigentes', async () => {
  const { original } = setup();
  try {
    for (const [from, to] of [
      ['revision', 'aprobada'],
      ['revision', 'cancelada'],
      ['aprobada', 'revision'],
      ['aprobada', 'cancelada'],
      ['cancelada', 'revision'],
      ['cancelada', 'aprobada'],
    ]) {
      await adminPreguntasCrudWriteMutationUpdateDeleteService.updatePregunta(
        '100', payload(to), '200', 'profesor',
      );
      assert.notEqual(from, to);
    }
  } finally {
    restore(original);
  }
});

test('profesor no asignado recibe 403 y no se actualiza la pregunta', async () => {
  const { original } = setup({ assigned: false });
  let updated = false;
  adminRepository.updatePregunta = async () => { updated = true; };
  try {
    await assert.rejects(
      () => adminPreguntasCrudWriteMutationUpdateDeleteService.updatePregunta('100', payload('aprobada'), '201', 'profesor'),
      (error) => error.status === 403,
    );
    assert.equal(updated, false);
  } finally {
    restore(original);
  }
});

test('administrador puede actualizar cualquier pregunta y los estados inválidos siguen rechazados por schema', async () => {
  const { original } = setup({ assigned: false, targetAssigned: false });
  try {
    await adminPreguntasCrudWriteMutationUpdateDeleteService.updatePregunta('100', payload('aprobada'), '1', 'admin');
    assert.equal(updatePreguntaSchema.safeParse(payload('otro')).success, false);
  } finally {
    restore(original);
  }
});
