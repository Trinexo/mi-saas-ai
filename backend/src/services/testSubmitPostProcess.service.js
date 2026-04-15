// Barrel de compatibilidad - los metodos se han dividido en testSubmitPostProcessSpaced y testSubmitPostProcessResponse.
import { testSubmitPostProcessSpacedService } from './testSubmitPostProcessSpaced.service.js';
import { testSubmitPostProcessResponseService } from './testSubmitPostProcessResponse.service.js';

export const testSubmitPostProcessService = {
  ...testSubmitPostProcessSpacedService,
  ...testSubmitPostProcessResponseService,
};

export { testSubmitPostProcessSpacedService, testSubmitPostProcessResponseService };