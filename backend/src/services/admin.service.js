// Barrel de compatibilidad — los metodos se han dividido en adminPreguntas y adminPanel.
import { adminPreguntasService } from './adminPreguntas.service.js';
import { adminPanelService } from './adminPanel.service.js';

export const adminService = {
  ...adminPreguntasService,
  ...adminPanelService,
};

export { adminPreguntasService, adminPanelService };
