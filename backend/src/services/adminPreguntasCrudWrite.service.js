// Barrel de compatibilidad - los metodos se han dividido en adminPreguntasCrudWriteMutation y adminPreguntasCrudWriteEstado.
import { adminPreguntasCrudWriteMutationService } from './adminPreguntasCrudWriteMutation.service.js';
import { adminPreguntasCrudWriteEstadoService } from './adminPreguntasCrudWriteEstado.service.js';

export const adminPreguntasCrudWriteService = {
  ...adminPreguntasCrudWriteMutationService,
  ...adminPreguntasCrudWriteEstadoService,
};

export { adminPreguntasCrudWriteMutationService, adminPreguntasCrudWriteEstadoService };
