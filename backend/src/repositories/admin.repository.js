// Barrel de compatibilidad — los metodos se han dividido en adminPreguntas y adminPanel.
import { adminPreguntasRepository } from './adminPreguntas.repository.js';
import { adminPanelRepository } from './adminPanel.repository.js';

export const adminRepository = {
  ...adminPreguntasRepository,
  ...adminPanelRepository,
};

export { adminPreguntasRepository, adminPanelRepository };
