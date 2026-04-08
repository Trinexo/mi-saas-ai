// Barrel de compatibilidad - los metodos se han dividido en authAccess y authProfile.
import { authAccessService } from './authAccess.service.js';
import { authProfileService } from './authProfile.service.js';

export const authService = {
  ...authAccessService,
  ...authProfileService,
};

export { authAccessService, authProfileService };
