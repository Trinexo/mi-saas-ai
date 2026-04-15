// Barrel de compatibilidad - los metodos se han dividido en catalogHierarchy y catalogPreguntas.
import { catalogHierarchyService } from './catalogHierarchy.service.js';
import { catalogPreguntasService } from './catalogPreguntas.service.js';

export const catalogService = {
  ...catalogHierarchyService,
  ...catalogPreguntasService,
};

export { catalogHierarchyService, catalogPreguntasService };