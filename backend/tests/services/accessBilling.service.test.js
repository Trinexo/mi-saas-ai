import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccessBillingService } from '../../src/services/accessBilling.service.js';

function clientWith({ access = null, duplicate = false } = {}) {
  const calls = [];
  const client = {
    calls,
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (/FROM accesos_oposicion\s+WHERE/i.test(sql)) return { rows: access ? [access] : [], rowCount: access ? 1 : 0 };
      if (/metadata->>'stripeEventId'/i.test(sql)) return { rows: duplicate ? [{ '?column?': 1 }] : [], rowCount: duplicate ? 1 : 0 };
      if (/INSERT INTO accesos_oposicion/i.test(sql)) return {
        rows: [{ id: '12', usuario_id: '7', oposicion_id: '9', estado: 'activo', modo_preparacion: 'albacer', modo_activo: 'guiado', fecha_inicio: '2026-08-01 00:00:00', fecha_fin: '2099-01-01 00:00:00', tipo_alumno: 'libre', precio_pagado: '29', notas: 'stripe' }],
        rowCount: 1,
      };
      if (/UPDATE accesos_oposicion/i.test(sql)) return {
        rows: [{ ...(access ?? {}), estado: 'activo', modo_preparacion: 'albacer', modo_activo: 'guiado', fecha_inicio: '2026-08-01 00:00:00', fecha_fin: '2099-01-01 00:00:00' }],
        rowCount: 1,
      };
      return { rows: [], rowCount: 0 };
    },
  };
  return client;
}

function fixtureAccess(overrides = {}) {
  return {
    id: '12', usuario_id: '7', oposicion_id: '9', estado: 'activo',
    modo_preparacion: 'albacer', modo_activo: 'guiado',
    fecha_inicio: '2026-08-01 00:00:00', fecha_fin: '2099-01-01 00:00:00',
    tipo_alumno: 'libre', precio_pagado: '29', notas: 'stripe', ...overrides,
  };
}

function serviceFor(client, { models = ['guiado'], events = [] } = {}) {
  return createAccessBillingService({
    modelosRepository: {
      async listarPorAcceso() { return models.map((modelo) => ({ modelo })); },
      async insertarModelo() {},
      async reemplazarModelos() {},
    },
    historialRepository: {
      async insertarEvento(event) { events.push(event); return event; },
    },
    clock: () => new Date('2026-08-01T00:00:00.000Z'),
  });
}

test('concesión Stripe crea un modelo y un evento de sistema sin actor', async () => {
  const client = clientWith();
  const events = [];
  const service = serviceFor(client, { events });
  const result = await service.grantOrRenewAccessFromBilling({
    usuarioId: '7', oposicionId: '9', fechaInicio: '2026-08-01T00:00:00Z', fechaFin: '2026-09-01T00:00:00Z',
    precioPagado: 29, notas: 'stripe', stripeEventId: 'evt_1', client,
  });
  assert.equal(result.operacion, 'concesion');
  assert.equal(events[0].actorUsuarioId, null);
  assert.deepEqual(events[0].metadata, { tipoActor: 'sistema', origen: 'stripe', stripeEventId: 'evt_1', operacion: 'concesion' });
});

test('evento Stripe repetido es idempotente sin historial nuevo', async () => {
  const client = clientWith({ access: fixtureAccess(), duplicate: true });
  const events = [];
  const service = serviceFor(client, { events });
  const result = await service.grantOrRenewAccessFromBilling({
    usuarioId: '7', oposicionId: '9', fechaInicio: '2026-08-01T00:00:00Z', fechaFin: '2026-09-01T00:00:00Z',
    stripeEventId: 'evt_repeat', client,
  });
  assert.equal(result.idempotente, true);
  assert.equal(events.length, 0);
});

test('revocado y cancelado no se reactivan', async () => {
  for (const estado of ['revocado', 'cancelado']) {
    const client = clientWith({ access: fixtureAccess({ estado }) });
    const service = serviceFor(client);
    await assert.rejects(
      () => service.grantOrRenewAccessFromBilling({ usuarioId: '7', oposicionId: '9', fechaInicio: '2026-08-01', fechaFin: '2026-09-01', stripeEventId: `evt_${estado}`, client }),
      (error) => error.code === 'ACCESS_BILLING_TERMINAL_STATE',
    );
  }
});

test('IDs BIGINT se conservan como string y los fuera de rango se rechazan', async () => {
  const client = clientWith();
  const service = serviceFor(client);
  const result = await service.grantOrRenewAccessFromBilling({
    usuarioId: '9223372036854775807', oposicionId: '9223372036854775806', fechaInicio: '2026-08-01', fechaFin: '2026-09-01', stripeEventId: 'evt_big', client,
  });
  assert.equal(result.operacion, 'concesion');
  await assert.rejects(
    () => service.grantOrRenewAccessFromBilling({ usuarioId: '9223372036854775808', oposicionId: '9', fechaInicio: '2026-08-01', fechaFin: '2026-09-01', stripeEventId: 'evt_bad', client }),
    /usuarioId inválido/,
  );
});

