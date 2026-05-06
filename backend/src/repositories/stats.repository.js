// Barrel de compatibilidad — los metodos se han dividido en widgetStats y progressStats.
// Este archivo expone statsRepository como objeto fusionado para no romper tests existentes.
import { widgetStatsRepository } from './widgetStats.repository.js';
import { progressStatsRepository } from './progressStats.repository.js';

export const statsRepository = {
  ...widgetStatsRepository,
  ...progressStatsRepository,

  // Compatibilidad con nombres legacy usados por tests y consumidores antiguos.
  getProgresoMaterias: (...args) => progressStatsRepository.getProgresoTemas(...args),
  getProgresoTemasByMateria: (...args) => progressStatsRepository.getProgresoBloquesByTema(...args),
  getDetalleTema: (...args) => progressStatsRepository.getDetalleBloque(...args),
};

export { widgetStatsRepository, progressStatsRepository };
