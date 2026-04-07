// Barrel de compatibilidad - los metodos se han dividido en adminDashboardStats y adminDashboardUsers.
import { adminDashboardStatsRepository } from './adminDashboardStats.repository.js';
import { adminDashboardUsersRepository } from './adminDashboardUsers.repository.js';

export const adminDashboardRepository = { ...adminDashboardStatsRepository, ...adminDashboardUsersRepository };
export { adminDashboardStatsRepository, adminDashboardUsersRepository };
