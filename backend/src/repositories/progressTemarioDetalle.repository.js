// Barrel de compatibilidad - los métodos se han dividido en progressTemarioDetalleBrowse y progressTemarioDetalleDetail.
import { progressTemarioDetalleBrowseRepository } from './progressTemarioDetalleBrowse.repository.js';
import { progressTemarioDetalleDetailRepository } from './progressTemarioDetalleDetail.repository.js';

export const progressTemarioDetalleRepository = { ...progressTemarioDetalleBrowseRepository, ...progressTemarioDetalleDetailRepository };
export { progressTemarioDetalleBrowseRepository, progressTemarioDetalleDetailRepository };