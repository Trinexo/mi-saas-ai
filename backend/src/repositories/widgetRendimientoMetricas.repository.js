// Barrel de compatibilidad - los métodos se han dividido en widgetRendimientoMetricasTiempo y widgetRendimientoMetricasPrecision.
import { widgetRendimientoMetricasTiempoRepository } from './widgetRendimientoMetricasTiempo.repository.js';
import { widgetRendimientoMetricasPrecisionRepository } from './widgetRendimientoMetricasPrecision.repository.js';

export const widgetRendimientoMetricasRepository = { ...widgetRendimientoMetricasTiempoRepository, ...widgetRendimientoMetricasPrecisionRepository };
export { widgetRendimientoMetricasTiempoRepository, widgetRendimientoMetricasPrecisionRepository };