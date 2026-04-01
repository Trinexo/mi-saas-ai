// Barrel de compatibilidad - los metodos se han dividido en adminPreguntasListado y adminPreguntasEntity.
import { adminPreguntasListadoRepository } from './adminPreguntasListado.repository.js';
import { adminPreguntasEntityRepository } from './adminPreguntasEntity.repository.js';

export const adminPreguntasRepository = {
  ...adminPreguntasListadoRepository,
  ...adminPreguntasEntityRepository,
};

export { adminPreguntasListadoRepository, adminPreguntasEntityRepository };
