import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';
import { adminDashboardUsersRepository } from '../repositories/adminDashboardUsers.repository.js';
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

  async createUser({ nombre, email, password, role, plan }) {
    const exists = await adminDashboardUsersRepository.findByEmail(email);
    if (exists) throw new ApiError(409, 'El email ya está registrado');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await adminDashboardUsersRepository.createUser({ nombre, email, passwordHash, role });
    if (plan && plan !== 'free') {
      try {
        await subscriptionService.assignPlan({ targetUserId: user.id, plan });
      } catch (_) { /* no bloquear si falla el plan */ }
    }
    return { id: user.id, nombre: user.nombre, email: user.email, role: user.role, plan: plan ?? 'free' };
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