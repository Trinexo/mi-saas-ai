// Barrel de compatibilidad - los metodos se han dividido en adminPreguntasCrudReadList y adminPreguntasCrudReadDetail.
import { adminPreguntasCrudReadListService } from './adminPreguntasCrudReadList.service.js';
import { adminPreguntasCrudReadDetailService } from './adminPreguntasCrudReadDetail.service.js';

export const adminPreguntasCrudReadService = {
  ...adminPreguntasCrudReadListService,
  ...adminPreguntasCrudReadDetailService,
};

export { adminPreguntasCrudReadListService, adminPreguntasCrudReadDetailService };
