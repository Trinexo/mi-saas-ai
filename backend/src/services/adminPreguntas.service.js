// Barrel de compatibilidad - los metodos se han dividido en adminPreguntasCrud y adminPreguntasImport.
import { adminPreguntasCrudService } from './adminPreguntasCrud.service.js';
import { adminPreguntasImportService } from './adminPreguntasImport.service.js';

export const adminPreguntasService = {
  ...adminPreguntasCrudService,
  ...adminPreguntasImportService,
};

export { adminPreguntasCrudService, adminPreguntasImportService };
