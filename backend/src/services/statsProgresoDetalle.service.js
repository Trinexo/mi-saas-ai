// Barrel de compatibilidad - los metodos se han dividido en statsProgresoDetalleTema y statsProgresoDetalleOposicion.
import { statsProgresoDetalleTemaService } from './statsProgresoDetalleTema.service.js';
import { statsProgresoDetalleOposicionService } from './statsProgresoDetalleOposicion.service.js';

export const statsProgresoDetalleService = {
  ...statsProgresoDetalleTemaService,
  ...statsProgresoDetalleOposicionService,
};

export { statsProgresoDetalleTemaService, statsProgresoDetalleOposicionService };
