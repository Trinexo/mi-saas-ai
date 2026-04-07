// Barrel de compatibilidad - los metodos se han dividido en statsProgresoResumen y statsProgresoDetalle.
import { statsProgresoResumenService } from './statsProgresoResumen.service.js';
import { statsProgresoDetalleService } from './statsProgresoDetalle.service.js';

export const statsProgresoService = {
  ...statsProgresoResumenService,
  ...statsProgresoDetalleService,
};

export { statsProgresoResumenService, statsProgresoDetalleService };
