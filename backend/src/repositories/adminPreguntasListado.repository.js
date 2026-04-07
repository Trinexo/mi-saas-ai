// Barrel de compatibilidad - los metodos se han dividido en adminPreguntasListadoBrowse y adminPreguntasListadoRevision.
import { adminPreguntasListadoBrowseRepository } from './adminPreguntasListadoBrowse.repository.js';
import { adminPreguntasListadoRevisionRepository } from './adminPreguntasListadoRevision.repository.js';

export const adminPreguntasListadoRepository = { ...adminPreguntasListadoBrowseRepository, ...adminPreguntasListadoRevisionRepository };
export { adminPreguntasListadoBrowseRepository, adminPreguntasListadoRevisionRepository };
