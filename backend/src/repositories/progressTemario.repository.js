// Barrel de compatibilidad - los metodos se han dividido en progressTemarioResumen y progressTemarioDetalle.
import { progressTemarioResumenRepository } from './progressTemarioResumen.repository.js';
import { progressTemarioDetalleRepository } from './progressTemarioDetalle.repository.js';

export const progressTemarioRepository = { ...progressTemarioResumenRepository, ...progressTemarioDetalleRepository };
export { progressTemarioResumenRepository, progressTemarioDetalleRepository };