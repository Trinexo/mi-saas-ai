import { adminPreguntasCrudWriteMutationCreateService } from './adminPreguntasCrudWriteMutationCreate.service.js';
import { adminPreguntasCrudWriteMutationUpdateDeleteService } from './adminPreguntasCrudWriteMutationUpdateDelete.service.js';

export const adminPreguntasCrudWriteMutationService = {
  ...adminPreguntasCrudWriteMutationCreateService,
  ...adminPreguntasCrudWriteMutationUpdateDeleteService,
};

export { adminPreguntasCrudWriteMutationCreateService, adminPreguntasCrudWriteMutationUpdateDeleteService };