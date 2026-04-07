// Barrel de compatibilidad - los metodos se han dividido en testQuestionsTheme y testQuestionsSpecial.
import { testQuestionsThemeRepository } from './testQuestionsTheme.repository.js';
import { testQuestionsSpecialRepository } from './testQuestionsSpecial.repository.js';

export const testQuestionsStandardRepository = { ...testQuestionsThemeRepository, ...testQuestionsSpecialRepository };
export { testQuestionsThemeRepository, testQuestionsSpecialRepository };
