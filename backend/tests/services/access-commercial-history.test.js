import assert from 'node:assert/strict';
import test from 'node:test';
import { createAccessAdminService } from '../../src/services/accessAdmin.service.js';

const access = () => ({
  id: '9223372036854775807',
  usuario_id: '10000000000000001',
  oposicion_id: '10000000000000002',
  estado: 'activo',
  modo_preparacion: 'experto',
  modo_activo: 'experto',
  fecha_inicio: '2026-01-01 00:00:00',
  fecha_fin: '2099-01-01 00:00:00',
  tipo_alumno: 'libre',
  precio_pagado: '10.00',
  notas: 'inicial',
});

function harness({ historyError = null } = {}) {
  let row = access();
  const events = [];
  const client = {
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();
      if (/^(BEGIN|COMMIT|ROLLBACK)$/.test(normalized)) return { rows: [], rowCount: 0 };
      if (normalized.startsWith('SELECT id, usuario_id')) return { rows: [{ ...row }], rowCount: 1 };
      if (normalized.startsWith('SELECT modelo')) return { rows: [{ modelo: 'experto' }], rowCount: 1 };
      if (normalized.startsWith('UPDATE accesos_oposicion')) {
        const update = { ...row };
        if (normalized.includes('precio_pagado =')) update.precio_pagado = params[1];
        if (normalized.includes('notas =')) update.notas = params[normalized.includes('precio_pagado =') ? 2 : 1];
        if (normalized.includes('tipo_alumno =')) update.tipo_alumno = params[params.length - 1];
        row = update;
        return { rows: [{ ...row }], rowCount: 1 };
      }
      throw new Error('SQL inesperado: ' + normalized);
    },
    release() {},
  };
  const service = createAccessAdminService({
    db: { async connect() { return client; } },
    modelosRepository: { async listarPorAcceso() { return [{ modelo: 'experto' }]; } },
    historialRepository: {
      async insertarEvento(event) {
        if (historyError) throw historyError;
        events.push(event);
        return event;
      },
    },
    contextService: { async obtenerContextoUsuario() { return { ok: true, row }; } },
  });
  return { service, events, get row() { return row; } };
}

const common = {
  accesoId: '9223372036854775807',
  actorUsuarioId: '7',
  principal: { tipo: 'administrador', usuarioId: '7' },
  motivo: 'ajuste comercial',
};

test('registra metadata comercial estricta con los campos realmente modificados', async () => {
  const h = harness();
  await h.service.modificarDatosComerciales({ ...common, precioPagado: 25, notas: 'actualizada' });
  assert.equal(h.events.length, 1);
  assert.equal(h.events[0].tipoEvento, 'datos_comerciales_modificados');
  assert.deepEqual(h.events[0].metadata, {
    camposModificados: ['precioPagado', 'notas'],
    anterior: { precioPagado: '10.00', notas: 'inicial' },
    nuevo: { precioPagado: 25, notas: 'actualizada' },
  });
  assert.deepEqual(Object.keys(h.events[0].nuevo), ['estado', 'modoActivo', 'modelos', 'vigencia']);
});

test('un cambio comercial idéntico no actualiza ni escribe historial', async () => {
  const h = harness();
  await h.service.modificarDatosComerciales({ ...common, precioPagado: 10, notas: 'inicial' });
  assert.equal(h.events.length, 0);
});

test('requiere motivo y conserva BIGINT como cadena', async () => {
  const h = harness();
  await assert.rejects(
    () => h.service.modificarDatosComerciales({ ...common, motivo: ' ', notas: 'x' }),
    (error) => error.code === 'ACCESS_ADMIN_INVALID_MOTIVE',
  );
  await h.service.modificarDatosComerciales({ ...common, tipoAlumno: 'albacer' });
  assert.equal(h.events[0].accesoId, '9223372036854775807');
});

test('revierte si falla la escritura del historial', async () => {
  const h = harness({ historyError: new Error('fallo controlado') });
  await assert.rejects(
    () => h.service.modificarDatosComerciales({ ...common, notas: 'fallo' }),
    /fallo controlado/,
  );
});
