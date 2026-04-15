// Barrel de compatibilidad - los metodos se han dividido en adminDashboardStats, adminDashboardUsers y adminProfesorAsignaciones.
import { adminDashboardStatsRepository } from './adminDashboardStats.repository.js';
import { adminDashboardUsersRepository } from './adminDashboardUsers.repository.js';
import { adminProfesorAsignacionesRepository } from './adminProfesorAsignaciones.repository.js';

export const adminDashboardRepository = {
  ...adminDashboardStatsRepository,
  ...adminDashboardUsersRepository,
  ...adminProfesorAsignacionesRepository,
};
export { adminDashboardStatsRepository, adminDashboardUsersRepository, adminProfesorAsignacionesRepository };
