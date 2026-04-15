// Barrel de compatibilidad - los metodos se han dividido en statsWidgetEngagementActividad y statsWidgetEngagementHabitos.
import { statsWidgetEngagementActividadService } from './statsWidgetEngagementActividad.service.js';
import { statsWidgetEngagementHabitosService } from './statsWidgetEngagementHabitos.service.js';

export const statsWidgetEngagementService = {
  ...statsWidgetEngagementActividadService,
  ...statsWidgetEngagementHabitosService,
};

export { statsWidgetEngagementActividadService, statsWidgetEngagementHabitosService };
