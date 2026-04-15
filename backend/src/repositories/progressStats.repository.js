// Barrel de compatibilidad - los metodos se han dividido en progressGeneral y progressTemario.
import { progressGeneralRepository } from './progressGeneral.repository.js';
import { progressTemarioRepository } from './progressTemario.repository.js';
import { progressTemarioDetalleDetailRepository } from './progressTemarioDetalleDetail.repository.js';

export const progressStatsRepository = {
  ...progressGeneralRepository,
  ...progressTemarioRepository,
  ...progressTemarioDetalleDetailRepository,
};

export { progressGeneralRepository, progressTemarioRepository };
