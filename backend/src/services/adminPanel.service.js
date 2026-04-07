// Barrel de compatibilidad - los metodos se han dividido en adminPanelReportes y adminPanelUsers.
import { adminPanelReportesService } from './adminPanelReportes.service.js';
import { adminPanelUsersService } from './adminPanelUsers.service.js';

export const adminPanelService = { ...adminPanelReportesService, ...adminPanelUsersService };
export { adminPanelReportesService, adminPanelUsersService };
