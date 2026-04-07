// Barrel de compatibilidad - los métodos se han dividido en widgetEngagementFocoTemas y widgetEngagementFocoSesion.
import { widgetEngagementFocoTemasRepository } from './widgetEngagementFocoTemas.repository.js';
import { widgetEngagementFocoSesionRepository } from './widgetEngagementFocoSesion.repository.js';

export const widgetEngagementFocoRepository = { ...widgetEngagementFocoTemasRepository, ...widgetEngagementFocoSesionRepository };
export { widgetEngagementFocoTemasRepository, widgetEngagementFocoSesionRepository };