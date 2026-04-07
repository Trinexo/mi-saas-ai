// Barrel de compatibilidad - los metodos se han dividido en widgetRendimientoActividad y widgetRendimientoMetricas.
import { widgetRendimientoActividadRepository } from './widgetRendimientoActividad.repository.js';
import { widgetRendimientoMetricasRepository } from './widgetRendimientoMetricas.repository.js';

export const widgetRendimientoRepository = { ...widgetRendimientoActividadRepository, ...widgetRendimientoMetricasRepository };
export { widgetRendimientoActividadRepository, widgetRendimientoMetricasRepository };
