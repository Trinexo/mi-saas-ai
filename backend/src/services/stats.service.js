// Barrel de compatibilidad - los metodos se han dividido en statsWidget y statsProgreso.
import { statsWidgetService } from './statsWidget.service.js';
import { statsProgresoService } from './statsProgreso.service.js';

export const statsService = { ...statsWidgetService, ...statsProgresoService };
export { statsWidgetService, statsProgresoService };
