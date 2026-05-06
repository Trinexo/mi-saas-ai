import { adminRepository } from '../repositories/admin.repository.js';
import { adminDashboardStatsRepository } from '../repositories/adminDashboardStats.repository.js';

export const adminPanelUsersStatsService = {
  async getAdminStats() {
    return adminRepository.getAdminStats();
  },

  async getBloquesConMasErrores(limit = 10) {
    return adminRepository.getBloquesConMasErrores(limit);
  },

  // B6 — stats completos para el Dashboard admin
  async getAdminStatsFull() {
    return adminDashboardStatsRepository.getAdminStatsFull();
  },

  async getDistribucionContenido() {
    return adminDashboardStatsRepository.getDistribucionContenido();
  },

  async getTopOposiciones(limit = 5) {
    return adminDashboardStatsRepository.getTopOposiciones(limit);
  },

  async getEvolucionUsuarios(dias = 30) {
    return adminDashboardStatsRepository.getEvolucionUsuarios(dias);
  },

  // B5 — actividad reciente
  async getActividadReciente(limit = 20) {
    return adminDashboardStatsRepository.getActividadReciente(limit);
  },

  async insertActividad(payload) {
    return adminDashboardStatsRepository.insertActividad(payload);
  },
};