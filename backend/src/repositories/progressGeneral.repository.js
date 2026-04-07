// Barrel de compatibilidad - los metodos se han dividido en progressGeneralStats y progressGeneralEvolucion.
import { progressGeneralStatsRepository } from './progressGeneralStats.repository.js';
import { progressGeneralEvolucionRepository } from './progressGeneralEvolucion.repository.js';

export const progressGeneralRepository = { ...progressGeneralStatsRepository, ...progressGeneralEvolucionRepository };
export { progressGeneralStatsRepository, progressGeneralEvolucionRepository };