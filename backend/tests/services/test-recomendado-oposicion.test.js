import test from 'node:test';
import assert from 'node:assert/strict';
import { testRecomendadoService } from '../../src/services/testRecomendado.service.js';
import { testRecomendadoRepository } from '../../src/repositories/testRecomendado.repository.js';
import { accesoOposicionRepository } from '../../src/repositories/accesoOposicion.repository.js';

const snapshot = (...targets) => targets.map((target) => ({ target, values: { ...target } }));
const restore = (snaps) => {
  for (const snap of snaps) Object.assign(snap.target, snap.values);
};

test('testRecomendadoService devuelve sugerencia neutra si la oposicion activa esta en Modo Albacer', async () => {
  const snaps = snapshot(testRecomendadoRepository, accesoOposicionRepository);

  accesoOposicionRepository.getAccesosActivos = async () => [];
  accesoOposicionRepository.getPreparacion = async (_userId, oposicionId) => ({
    oposicion_id: oposicionId,
    nombre: 'Policia Nacional',
    modo_preparacion: 'albacer',
  });
  testRecomendadoRepository.bloquesRecientesPracticados = async () => {
    throw new Error('No debe consultar recomendaciones libres en Albacer');
  };

  try {
    const result = await testRecomendadoService.getSugerencia(7, 'pro', { oposicionId: 21 });

    assert.equal(result.modo, 'albacer');
    assert.equal(result.oposicionId, 21);
    assert.equal(result.oposicionNombre, 'Policia Nacional');
    assert.equal(result.numeroPreguntas, 0);
  } finally {
    restore(snaps);
  }
});

test('testRecomendadoService limita la recomendacion a la oposicion activa en Modo Experto', async () => {
  const snaps = snapshot(testRecomendadoRepository, accesoOposicionRepository);
  const calls = [];

  accesoOposicionRepository.getAccesosActivos = async () => [
    { oposicion_id: 99, nombre: 'Otra oposicion', modo_preparacion: 'experto' },
  ];
  accesoOposicionRepository.getPreparacion = async (_userId, oposicionId) => ({
    oposicion_id: oposicionId,
    nombre: 'Auxiliar Administrativo',
    modo_preparacion: 'experto',
  });
  testRecomendadoRepository.bloquesRecientesPracticados = async (_userId, _horas, oposicionId) => {
    calls.push(['recientes', oposicionId]);
    return [4];
  };
  testRecomendadoRepository.bloqueConMasRepasoPendiente = async (_userId, oposicionId) => {
    calls.push(['repaso', oposicionId]);
    return null;
  };
  testRecomendadoRepository.bloqueConMasErrores = async (_userId, oposicionId) => {
    calls.push(['errores', oposicionId]);
    return null;
  };
  testRecomendadoRepository.contarTests = async (_userId, oposicionId) => {
    calls.push(['contar', oposicionId]);
    return 0;
  };
  testRecomendadoRepository.bloqueConMenosVistas = async (_userId, oposicionId) => {
    calls.push(['menos_vistas', oposicionId]);
    return { bloqueId: 12, bloqueNombre: 'Tema comun' };
  };

  try {
    const result = await testRecomendadoService.getSugerencia(7, 'pro', { oposicionId: 21 });

    assert.equal(result.oposicionId, 21);
    assert.equal(result.oposicionNombre, 'Auxiliar Administrativo');
    assert.equal(result.modo, 'normal');
    assert.ok(calls.length > 0);
    assert.ok(calls.every(([, oposicionId]) => oposicionId === 21));
  } finally {
    restore(snaps);
  }
});
