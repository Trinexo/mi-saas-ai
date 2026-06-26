// Barrel de compatibilidad - los metodos se han dividido en statsWidget y statsProgreso.
import { ApiError } from '../utils/api-error.js';
import { statsWidgetService } from './statsWidget.service.js';
import { statsProgresoService } from './statsProgreso.service.js';

const ensurePositiveInteger = (value, fieldName) => {
	if (!Number.isInteger(value) || value <= 0) {
		throw new ApiError(400, `${fieldName} debe ser un entero positivo`);
	}

	return value;
};

export const statsService = {
	...statsWidgetService,
	...statsProgresoService,

	// Compatibilidad con nombres legacy usados por tests y consumidores antiguos.
	getTemaStats(userId, temaId) {
		return statsProgresoService.getBloqueStats(userId, temaId);
	},

	getProgresoMaterias(userId, oposicionId, options = {}) {
		return statsProgresoService.getProgresoTemas(userId, ensurePositiveInteger(oposicionId, 'oposicion_id'), options);
	},

	getProgresoTemasReal(userId, oposicionId, options = {}) {
		return statsProgresoService.getProgresoTemasReal(userId, oposicionId ? ensurePositiveInteger(oposicionId, 'oposicion_id') : null, options);
	},

	getProgresoTemaReal(userId, temaId, options = {}) {
		return statsProgresoService.getProgresoTemaReal(userId, ensurePositiveInteger(temaId, 'tema_id'), options);
	},

	getProgresoTemasByMateria(userId, materiaId, options = {}) {
		return statsProgresoService.getProgresoBloquesByTema(userId, ensurePositiveInteger(materiaId, 'materia_id'), options);
	},

	getDetalleTema(userId, temaId, options = {}) {
		return statsProgresoService.getDetalleBloque(userId, ensurePositiveInteger(temaId, 'tema_id'), options);
	},
};
export { statsWidgetService, statsProgresoService };
