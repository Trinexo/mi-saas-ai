import { ApiError } from '../utils/api-error.js';

export const testSubmitValidationTestService = {
  assertTestExistsAndOwner(test, userId) {
    if (!test || test.usuario_id !== userId) {
      throw new ApiError(404, 'Test no encontrado');
    }
  },

  assertTestNotFinalized(test) {
    if (test.estado === 'finalizado') {
      throw new ApiError(409, 'El test ya fue enviado');
    }
  },
};