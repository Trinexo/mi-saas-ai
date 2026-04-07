// Barrel de compatibilidad - los metodos se han dividido en adminPreguntasEntityWrite y adminPreguntasEntityRead.
import { adminPreguntasEntityWriteRepository } from './adminPreguntasEntityWrite.repository.js';
import { adminPreguntasEntityReadRepository } from './adminPreguntasEntityRead.repository.js';

export const adminPreguntasEntityRepository = { ...adminPreguntasEntityWriteRepository, ...adminPreguntasEntityReadRepository };
export { adminPreguntasEntityWriteRepository, adminPreguntasEntityReadRepository };
