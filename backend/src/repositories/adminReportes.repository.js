// Barrel de compatibilidad - los metodos se han dividido en adminReportesPreguntas y adminReportesAuditoria.
import { adminReportesPreguntasRepository } from './adminReportesPreguntas.repository.js';
import { adminReportesAuditoriaRepository } from './adminReportesAuditoria.repository.js';

export const adminReportesRepository = { ...adminReportesPreguntasRepository, ...adminReportesAuditoriaRepository };
export { adminReportesPreguntasRepository, adminReportesAuditoriaRepository };