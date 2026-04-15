// Barrel de compatibilidad - los metodos se han dividido en adminPanelReportesEstado.
import { adminPanelReportesEstadoService } from './adminPanelReportesEstado.service.js';

export const adminPanelReportesWriteService = {
  ...adminPanelReportesEstadoService,
};

export { adminPanelReportesEstadoService };
