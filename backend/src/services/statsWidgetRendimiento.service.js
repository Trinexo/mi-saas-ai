// Barrel de compatibilidad - los metodos se han dividido en statsWidgetRendimientoEficiencia y statsWidgetRendimientoCalidad.
import { statsWidgetRendimientoEficienciaService } from './statsWidgetRendimientoEficiencia.service.js';
import { statsWidgetRendimientoCalidadService } from './statsWidgetRendimientoCalidad.service.js';

export const statsWidgetRendimientoService = {
  ...statsWidgetRendimientoEficienciaService,
  ...statsWidgetRendimientoCalidadService,
};

export { statsWidgetRendimientoEficienciaService, statsWidgetRendimientoCalidadService };
