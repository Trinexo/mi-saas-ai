// Barrel de compatibilidad — los metodos se han dividido en adminPreguntas y adminPanel.
import { adminPreguntasRepository } from './adminPreguntas.repository.js';
import { adminPanelRepository } from './adminPanel.repository.js';
import { adminPreguntasListadoBrowseRepository } from './adminPreguntasListadoBrowse.repository.js';

export const adminRepository = {
  ...adminPreguntasRepository,
  ...adminPanelRepository,
  // Métodos de scope/filtrado de profesor (listado browse)
  listUserAssignedOposiciones: (...args) => adminPreguntasListadoBrowseRepository.listUserAssignedOposiciones(...args),
  existsTemaInOposiciones: (...args) => adminPreguntasListadoBrowseRepository.existsTemaInOposiciones(...args),
};

export { adminPreguntasRepository, adminPanelRepository };
