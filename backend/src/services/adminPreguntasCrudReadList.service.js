import { adminPreguntasCrudReadListPreguntasService } from './adminPreguntasCrudReadListPreguntas.service.js';
import { adminPreguntasCrudReadListSinRevisarService } from './adminPreguntasCrudReadListSinRevisar.service.js';

export const adminPreguntasCrudReadListService = {
  ...adminPreguntasCrudReadListPreguntasService,
  ...adminPreguntasCrudReadListSinRevisarService,
};

export { adminPreguntasCrudReadListPreguntasService, adminPreguntasCrudReadListSinRevisarService };