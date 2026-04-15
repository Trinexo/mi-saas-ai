// Barrel de compatibilidad - los metodos se han dividido en authProfileRead y authProfileWrite.
import { authProfileReadService } from './authProfileRead.service.js';
import { authProfileWriteService } from './authProfileWrite.service.js';

export const authProfileService = {
  ...authProfileReadService,
  ...authProfileWriteService,
};

export { authProfileReadService, authProfileWriteService };
