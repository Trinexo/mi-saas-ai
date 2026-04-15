// Barrel de compatibilidad - los metodos se han dividido en testSubmitValidationTest y testSubmitValidationRespuestas.
import { testSubmitValidationTestService } from './testSubmitValidationTest.service.js';
import { testSubmitValidationRespuestasService } from './testSubmitValidationRespuestas.service.js';

export const testSubmitValidationService = {
  ...testSubmitValidationTestService,
  ...testSubmitValidationRespuestasService,
};

export { testSubmitValidationTestService, testSubmitValidationRespuestasService };
