// Barrel de compatibilidad - los metodos se han dividido en adminPanelUsersRead y adminPanelUsersWrite.
import { adminPanelUsersReadService } from './adminPanelUsersRead.service.js';
import { adminPanelUsersWriteService } from './adminPanelUsersWrite.service.js';

export const adminPanelUsersService = {
  ...adminPanelUsersReadService,
  ...adminPanelUsersWriteService,
};

export { adminPanelUsersReadService, adminPanelUsersWriteService };
