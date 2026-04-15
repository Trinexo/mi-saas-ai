// Barrel de compatibilidad - los metodos se han dividido en adminPanelUsersRole.
import { adminPanelUsersRoleService } from './adminPanelUsersRole.service.js';

export const adminPanelUsersWriteService = {
  ...adminPanelUsersRoleService,
};

export { adminPanelUsersRoleService };
