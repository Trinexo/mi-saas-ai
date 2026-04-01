// Barrel de compatibilidad - los metodos se han dividido en widgetRendimiento y widgetEngagement.
import { widgetRendimientoRepository } from './widgetRendimiento.repository.js';
import { widgetEngagementRepository } from './widgetEngagement.repository.js';

export const widgetStatsRepository = {
  ...widgetRendimientoRepository,
  ...widgetEngagementRepository,
};

export { widgetRendimientoRepository, widgetEngagementRepository };
