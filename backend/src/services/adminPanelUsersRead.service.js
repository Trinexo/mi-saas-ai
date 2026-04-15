// Barrel de compatibilidad - los metodos se han dividido en adminPanelUsersStats y adminPanelUsersList.
import { adminPanelUsersStatsService } from './adminPanelUsersStats.service.js';
import { adminPanelUsersListService } from './adminPanelUsersList.service.js';

export const adminPanelUsersReadService = {
  ...adminPanelUsersStatsService,
  ...adminPanelUsersListService,
};

export { adminPanelUsersStatsService, adminPanelUsersListService };
