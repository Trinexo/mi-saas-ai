// Barrel de compatibilidad — los metodos se han dividido en widgetStats y progressStats.
// Este archivo expone statsRepository como objeto fusionado para no romper tests existentes.
import { widgetStatsRepository } from './widgetStats.repository.js';
import { progressStatsRepository } from './progressStats.repository.js';

export const statsRepository = {
  ...widgetStatsRepository,
  ...progressStatsRepository,
};

export { widgetStatsRepository, progressStatsRepository };
