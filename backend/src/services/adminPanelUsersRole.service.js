import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';

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
};