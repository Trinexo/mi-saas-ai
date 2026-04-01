// Barrel de compatibilidad - los metodos se han dividido en testSessionRead y testSessionWrite.
import { testSessionReadRepository } from './testSessionRead.repository.js';
import { testSessionWriteRepository } from './testSessionWrite.repository.js';

export const testSessionRepository = {
  ...testSessionReadRepository,
  ...testSessionWriteRepository,
};

export { testSessionReadRepository, testSessionWriteRepository };
