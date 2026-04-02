// Barrel de compatibilidad - los metodos se han dividido en adminPreguntasCrudRead y adminPreguntasCrudWrite.
import { adminPreguntasCrudReadService } from './adminPreguntasCrudRead.service.js';
import { adminPreguntasCrudWriteService } from './adminPreguntasCrudWrite.service.js';

export const adminPreguntasCrudService = { ...adminPreguntasCrudReadService, ...adminPreguntasCrudWriteService };
export { adminPreguntasCrudReadService, adminPreguntasCrudWriteService };
