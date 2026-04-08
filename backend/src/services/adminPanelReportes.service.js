// Barrel de compatibilidad - los metodos se han dividido en adminPanelReportesRead y adminPanelReportesWrite.
import { adminPanelReportesReadService } from './adminPanelReportesRead.service.js';
import { adminPanelReportesWriteService } from './adminPanelReportesWrite.service.js';

export const adminPanelReportesService = {
  ...adminPanelReportesReadService,
  ...adminPanelReportesWriteService,
};

export { adminPanelReportesReadService, adminPanelReportesWriteService };
