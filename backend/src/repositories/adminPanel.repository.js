// Barrel de compatibilidad - los metodos se han dividido en adminReportes y adminDashboard.
import { adminReportesRepository } from './adminReportes.repository.js';
import { adminDashboardRepository } from './adminDashboard.repository.js';

export const adminPanelRepository = {
  ...adminReportesRepository,
  ...adminDashboardRepository,
};

export { adminReportesRepository, adminDashboardRepository };
