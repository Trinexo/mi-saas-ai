import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';

export const accesoOposicionService = {
  async getMisAccesos(userId) {
    return accesoOposicionRepository.getAccesosActivos(userId);
  },

  async tieneAcceso(userId, oposicionId) {
    return accesoOposicionRepository.tieneAcceso(userId, oposicionId);
  },

  async asignarAcceso({ userId, oposicionId, fechaFin, precioPagado, notas }) {
    return accesoOposicionRepository.crearAcceso({ userId, oposicionId, fechaFin, precioPagado, notas });
  },

  async cancelarAcceso(userId, oposicionId) {
    return accesoOposicionRepository.cancelarAcceso(userId, oposicionId);
  },

  async updateAcceso(userId, oposicionId, updates) {
    return accesoOposicionRepository.updateAcceso(userId, oposicionId, updates);
  },

  async listAll(filters) {
    return accesoOposicionRepository.listAll(filters);
  },

  async getStats() {
    return accesoOposicionRepository.getStats();
  },

  async getUserByEmail(email) {
    return accesoOposicionRepository.getUserByEmail(email);
  },
};
