// Barrel de compatibilidad - los metodos se han dividido en statsWidgetRendimiento y statsWidgetEngagement.
import { statsWidgetRendimientoService } from './statsWidgetRendimiento.service.js';
import { statsWidgetEngagementService } from './statsWidgetEngagement.service.js';

export const statsWidgetService = {
  ...statsWidgetRendimientoService,
  ...statsWidgetEngagementService,
};

export { statsWidgetRendimientoService, statsWidgetEngagementService };
