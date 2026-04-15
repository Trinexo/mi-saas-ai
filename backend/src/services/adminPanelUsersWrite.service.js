// Barrel de compatibilidad - los metodos se han dividido en adminPanelUsersRole, adminPanelProfesorAsignaciones y adminPanelProfesoresCrud.
import { adminPanelUsersRoleService } from './adminPanelUsersRole.service.js';
import { adminPanelProfesorAsignacionesService } from './adminPanelProfesorAsignaciones.service.js';
import { adminPanelProfesoresCrudService } from './adminPanelProfesoresCrud.service.js';

export const adminPanelUsersWriteService = {
  ...adminPanelUsersRoleService,
  ...adminPanelProfesorAsignacionesService,
  ...adminPanelProfesoresCrudService,
};

export { adminPanelUsersRoleService, adminPanelProfesorAsignacionesService, adminPanelProfesoresCrudService };
