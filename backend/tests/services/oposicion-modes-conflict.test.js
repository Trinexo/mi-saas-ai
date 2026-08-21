import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogAdminRepository } from '../../src/repositories/catalogAdmin.repository.js';
import { catalogAdminOposicionService } from '../../src/services/catalogAdminOposicion.service.js';

test('la restricción de modos conserva todos los accesos incompatibles en el 409', async () => {
  const original = catalogAdminRepository.updateOposicion;
  catalogAdminRepository.updateOposicion = async () => {
    const error = new Error('incompatible');
    error.code = 'OPPOSITION_MODES_INCOMPATIBLE';
    error.details = {
      oposicionId: '6',
      modelosActuales: ['experto', 'guiado'],
      modelosSolicitados: ['guiado'],
      accesosIncompatibles: [
        {
          acceso_id: '9007199254740993',
          usuario_id: '9007199254740994',
          modelos_disponibles: ['experto'],
          modo_activo: 'experto',
          modelos_efectivos_resultantes: [],
          motivo_codigo: 'sin_modelo_compatible',
        },
        {
          acceso_id: '9007199254740995',
          usuario_id: '9007199254740996',
          modelos_disponibles: ['experto', 'guiado'],
          modo_activo: 'experto',
          modelos_efectivos_resultantes: ['guiado'],
          motivo_codigo: 'modo_activo_incompatible',
        },
      ],
    };
    throw error;
  };

  try {
    await assert.rejects(
      () => catalogAdminOposicionService.updateOposicion('6', { modelos_disponibles: ['guiado'] }),
      (error) => {
        assert.equal(error.status, 409);
        assert.equal(error.details.oposicionId, '6');
        assert.equal(error.details.accesosIncompatibles.length, 2);
        assert.equal(error.details.accesosIncompatibles[0].accesoId, '9007199254740993');
        assert.equal(error.details.accesosIncompatibles[0].alumno.email, null);
        assert.equal(error.details.accesosIncompatibles[1].motivoCodigo, 'modo_activo_incompatible');
        return true;
      },
    );
  } finally {
    catalogAdminRepository.updateOposicion = original;
  }
});
