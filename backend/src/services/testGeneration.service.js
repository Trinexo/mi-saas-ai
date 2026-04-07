// Barrel de compatibilidad - los metodos se han dividido en testGenerationGenerate y testGenerationRefuerzo.
import { testGenerationGenerateService } from './testGenerationGenerate.service.js';
import { testGenerationRefuerzoService } from './testGenerationRefuerzo.service.js';

export const testGenerationService = { ...testGenerationGenerateService, ...testGenerationRefuerzoService };
export { testGenerationGenerateService, testGenerationRefuerzoService };
