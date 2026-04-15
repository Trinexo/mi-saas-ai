import { adminRepository } from '../repositories/admin.repository.js';

export const adminPanelUsersStatsService = {
  async getAdminStats() {
    return adminRepository.getAdminStats();
  },

  async getTemasConMasErrores(limit = 10) {
    return adminRepository.getTemasConMasErrores(limit);
  },
};