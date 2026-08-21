import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../../src/config/db.js';
import { adminRepository } from '../../src/repositories/admin.repository.js';
import { adminPreguntasCrudWriteMutationCreateService } from '../../src/services/adminPreguntasCrudWriteMutationCreate.service.js';

test('crear pregunta no oficial no toca asociaciones de años ni exámenes', async () => {
  const originalConnect = pool.connect;
  const original = {
    createPregunta: adminRepository.createPregunta,
    createOpciones: adminRepository.createOpciones,
    insertAuditoria: adminRepository.insertAuditoria,
    setYears: adminRepository.setYearsForPreguntaWithClient,
    setExams: adminRepository.setExamsForPreguntaWithClient,
  };
  const queries = [];
  const client = {
    async query(sql) { queries.push(sql); return { rows: [{ id: '9001', estado: 'aprobada' }] }; },
    release() {},
  };

  pool.connect = async () => client;
  adminRepository.createPregunta = async () => ({ id: '9001', estado: 'aprobada' });
  adminRepository.createOpciones = async () => {};
  adminRepository.insertAuditoria = async () => {};
  adminRepository.setYearsForPreguntaWithClient = async () => { throw new Error('años no deben tocarse'); };
  adminRepository.setExamsForPreguntaWithClient = async () => { throw new Error('exámenes no deben tocarse'); };

  try {
    const result = await adminPreguntasCrudWriteMutationCreateService.createPregunta({
      temaId: 1,
      enunciado: 'Pregunta no oficial suficientemente larga',
      explicacion: 'Explicación',
      nivelDificultad: 'media',
      opciones: [{ texto: 'A', correcta: true }, { texto: 'B', correcta: false }],
    }, { userId: 1, role: 'admin' });
    assert.equal(result.id, '9001');
    assert.deepEqual(queries, ['BEGIN', 'COMMIT']);
  } finally {
    pool.connect = originalConnect;
    Object.assign(adminRepository, {
      createPregunta: original.createPregunta,
      createOpciones: original.createOpciones,
      insertAuditoria: original.insertAuditoria,
      setYearsForPreguntaWithClient: original.setYears,
      setExamsForPreguntaWithClient: original.setExams,
    });
  }
});
