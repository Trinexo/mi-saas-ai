// Barrel de compatibilidad - los metodos se han dividido en widgetEngagementFoco y widgetEngagementRacha.
import { widgetEngagementFocoRepository } from './widgetEngagementFoco.repository.js';
import { widgetEngagementRachaRepository } from './widgetEngagementRacha.repository.js';

export const widgetEngagementRepository = { ...widgetEngagementFocoRepository, ...widgetEngagementRachaRepository };
export { widgetEngagementFocoRepository, widgetEngagementRachaRepository };
