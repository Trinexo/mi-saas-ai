// Barrel de compatibilidad - los metodos se han dividido en adminPreguntasImportCsvParser y adminPreguntasImportCsvMapper.
import { adminPreguntasImportCsvParserService } from './adminPreguntasImportCsvParser.service.js';
import { adminPreguntasImportCsvMapperService } from './adminPreguntasImportCsvMapper.service.js';

export const adminPreguntasImportCsvService = {
  ...adminPreguntasImportCsvParserService,
  ...adminPreguntasImportCsvMapperService,
};

export { adminPreguntasImportCsvParserService, adminPreguntasImportCsvMapperService };
