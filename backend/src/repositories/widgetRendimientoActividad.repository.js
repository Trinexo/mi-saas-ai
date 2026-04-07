// Barrel de compatibilidad - los métodos se han dividido en widgetRendimientoActividadConsistencia y widgetRendimientoActividadSemanal.
import { widgetRendimientoActividadConsistenciaRepository } from './widgetRendimientoActividadConsistencia.repository.js';
import { widgetRendimientoActividadSemanalRepository } from './widgetRendimientoActividadSemanal.repository.js';

export const widgetRendimientoActividadRepository = { ...widgetRendimientoActividadConsistenciaRepository, ...widgetRendimientoActividadSemanalRepository };
export { widgetRendimientoActividadConsistenciaRepository, widgetRendimientoActividadSemanalRepository };