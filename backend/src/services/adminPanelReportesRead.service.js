// Barrel de compatibilidad - los metodos se han dividido en adminPanelReportesAuditoria y adminPanelReportesLista.
import { adminPanelReportesAuditoriaService } from './adminPanelReportesAuditoria.service.js';
import { adminPanelReportesListaService } from './adminPanelReportesLista.service.js';

export const adminPanelReportesReadService = {
  ...adminPanelReportesAuditoriaService,
  ...adminPanelReportesListaService,
};

export { adminPanelReportesAuditoriaService, adminPanelReportesListaService };
