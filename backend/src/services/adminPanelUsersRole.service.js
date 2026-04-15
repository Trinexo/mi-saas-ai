import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';
import { subscriptionService } from './subscription.service.js';

export const adminPanelUsersRoleService = {
  async updateUserRole(userId, role, requestingUser) {
    if (Number(userId) === requestingUser.id) {
      throw new ApiError(400, 'No puedes cambiar tu propio rol');
    }
    const updated = await adminRepository.updateUserRole(userId, role);
    if (!updated) {
      throw new ApiError(404, 'Usuario no encontrado');
    }
    return updated;
  },

  async deleteUser(userId, requestingUser) {
    if (Number(userId) === requestingUser.id) {
      throw new ApiError(400, 'No puedes eliminar tu propia cuenta');
    }
    const deleted = await adminRepository.deleteUser(userId);
    if (!deleted) {
      throw new ApiError(404, 'Usuario no encontrado');
    }
    return deleted;
  },

  async bulkUsers({ ids, action, value, requestingUser }) {
    // Evitar que el admin se incluya en operaciones destructivas o de rol
    const safeIds = ids.filter((id) => id !== requestingUser.id);
    if (safeIds.length === 0) {
      throw new ApiError(400, 'No puedes aplicar esta acción sobre tu propia cuenta');
    }

    if (action === 'delete') {
      const count = await adminRepository.bulkDeleteUsers(safeIds);
      return { affected: count };
    }

    if (action === 'set_role') {
      if (!value) throw new ApiError(400, 'Falta el valor del rol');
      const count = await adminRepository.bulkUpdateRole(safeIds, value);
      return { affected: count };
    }

    if (action === 'set_plan') {
      if (!value) throw new ApiError(400, 'Falta el valor del plan');
      let affected = 0;
      for (const userId of safeIds) {
        try {
          await subscriptionService.assignPlan({ targetUserId: userId, plan: value });
          affected++;
        } catch (_) { /* continuar con los siguientes */ }
      }
      return { affected };
    }

    throw new ApiError(400, `Acción desconocida: ${action}`);
  },
};