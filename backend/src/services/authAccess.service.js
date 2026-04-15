import { authAccessRegisterService } from './authAccessRegister.service.js';
import { authAccessLoginService } from './authAccessLogin.service.js';

export const authAccessService = {
  ...authAccessRegisterService,
  ...authAccessLoginService,
};

export { authAccessRegisterService, authAccessLoginService };
