import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimulacroProfesorSchema } from '../../src/schemas/profesorSimulacros.schema.js';

test('el schema de profesor acepta la configuración simplificada completa', () => {
  const result = createSimulacroProfesorSchema.parse({
    nombre: 'Simulacro C3',
    oposicion_id: '8',
    wizard_simplificado: true,
    configuracion_preguntas: {
      total_preguntas: 3,
      tema_ids: ['10', '11'],
      officialidad: 'official',
      anio_ids: ['20'],
      examen_ids: ['30', '31'],
      reparto_por_tema: true,
      reparto: [
        { tema_id: '10', cantidad: 1 },
        { tema_id: '11', cantidad: 2 },
      ],
    },
  });

  assert.deepEqual(result.configuracion_preguntas.examen_ids, [30, 31]);
  assert.equal(result.configuracion_preguntas.reparto_por_tema, true);
});
