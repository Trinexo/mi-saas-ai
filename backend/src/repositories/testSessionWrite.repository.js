// Barrel de compatibilidad - los metodos se han dividido en testSessionWriteSetup y testSessionWriteEvaluate.
import { testSessionWriteSetupRepository } from './testSessionWriteSetup.repository.js';
import { testSessionWriteEvaluateRepository } from './testSessionWriteEvaluate.repository.js';

export const testSessionWriteRepository = { ...testSessionWriteSetupRepository, ...testSessionWriteEvaluateRepository };
export { testSessionWriteSetupRepository, testSessionWriteEvaluateRepository };
