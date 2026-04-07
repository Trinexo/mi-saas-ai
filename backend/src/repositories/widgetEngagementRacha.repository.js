// Barrel de compatibilidad - los métodos se han dividido en widgetEngagementRachaGamificacion y widgetEngagementRachaStreaks.
import { widgetEngagementRachaGamificacionRepository } from './widgetEngagementRachaGamificacion.repository.js';
import { widgetEngagementRachaStreaksRepository } from './widgetEngagementRachaStreaks.repository.js';

export const widgetEngagementRachaRepository = { ...widgetEngagementRachaGamificacionRepository, ...widgetEngagementRachaStreaksRepository };
export { widgetEngagementRachaGamificacionRepository, widgetEngagementRachaStreaksRepository };