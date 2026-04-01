// Barrel de re-exportacion — los metodos se han dividido en dos repositorios especializados.
// Este archivo mantiene compatibilidad con importaciones existentes.
export { widgetStatsRepository as statsRepository } from './widgetStats.repository.js';
export { progressStatsRepository } from './progressStats.repository.js';
