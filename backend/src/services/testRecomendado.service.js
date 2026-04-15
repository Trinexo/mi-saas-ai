import { testRecomendadoRepository } from '../repositories/testRecomendado.repository.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { PLAN_LIMITS } from '../config/plans.config.js';

export const testRecomendadoService = {
  async getSugerencia(userId, plan = 'free') {
    const limits = PLAN_LIMITS[plan];

    const accesos = await accesoOposicionRepository.getAccesosActivos(userId);
    const oposicionId = accesos.length > 0 ? Number(accesos[0].oposicion_id) : null;
    const oposicionNombre = await testRecomendadoRepository.getNombreOposicion(oposicionId);

    const s = (campos) => ({ oposicionNombre, ...campos });

    // Temas practicados en las últimas 24h — se usan para evitar recomendar el mismo
    const recientes = await testRecomendadoRepository.temasRecientesPracticados(userId);

    if (limits.repasoEspaciado) {
      const temaRepaso = await testRecomendadoRepository.temaConMasRepasoPendiente(userId);
      if (temaRepaso && temaRepaso.pendientes >= 3) {
        return s({
          modo: 'repaso', temaId: temaRepaso.temaId, oposicionId,
          numeroPreguntas: Math.min(temaRepaso.pendientes, 20), dificultad: 'mixto',
          motivo: `Tienes ${temaRepaso.pendientes} preguntas pendientes de repaso en "${temaRepaso.temaNombre}".`,
        });
      }
    }

    // Busca el tema con más errores excluyendo los recientes; si no hay, sin exclusión
    const temaError = await testRecomendadoRepository.temaConMasErrores(userId, oposicionId, recientes)
      ?? await testRecomendadoRepository.temaConMasErrores(userId, oposicionId);
    if (temaError && temaError.tasaError >= 30) {
      // Si además hay un tema sin explorar, mezcla: 60% errores + 40% nuevo
      const temaNuevo = await testRecomendadoRepository.temaConMenosVistas(
        userId, oposicionId, [...recientes, temaError.temaId],
      ) ?? await testRecomendadoRepository.temaConMenosVistas(userId, oposicionId, [temaError.temaId]);
      if (temaNuevo && temaNuevo.temaId !== temaError.temaId) {
        return s({
          modo: 'adaptativo', temaId: null, oposicionId,
          temasMix: [
            { temaId: temaError.temaId, pct: 60 },
            { temaId: temaNuevo.temaId, pct: 40 },
          ],
          numeroPreguntas: 10, dificultad: 'mixto',
          motivo: `Refuerza "${temaError.temaNombre}" (${temaError.tasaError}% error) y descubre "${temaNuevo.temaNombre}".`,
        });
      }
      return s({
        modo: 'adaptativo', temaId: temaError.temaId, oposicionId,
        numeroPreguntas: 10, dificultad: 'mixto',
        motivo: `Tasa de error del ${temaError.tasaError}% en "${temaError.temaNombre}". Refuerzalo.`,
      });
    }

    const totalTests = await testRecomendadoRepository.contarTests(userId);
    if (oposicionId && totalTests < 3) {
      const temaNuevo = await testRecomendadoRepository.temaConMenosVistas(userId, oposicionId, recientes)
        ?? await testRecomendadoRepository.temaConMenosVistas(userId, oposicionId);
      if (temaNuevo) {
        return s({
          modo: 'normal', temaId: temaNuevo.temaId, oposicionId,
          numeroPreguntas: 10, dificultad: 'mixto',
          motivo: `Aun no has practicado "${temaNuevo.temaNombre}". Empieza hoy.`,
        });
      }
    }

    if (oposicionId) {
      const temaMenosVisto = await testRecomendadoRepository.temaConMenosVistas(userId, oposicionId, recientes)
        ?? await testRecomendadoRepository.temaConMenosVistas(userId, oposicionId);
      if (temaMenosVisto) {
        return s({
          modo: 'adaptativo', temaId: temaMenosVisto.temaId, oposicionId,
          numeroPreguntas: 10, dificultad: 'mixto',
          motivo: `El tema "${temaMenosVisto.temaNombre}" todavia tiene preguntas por descubrir.`,
        });
      }
    }

    return s({
      modo: 'adaptativo', temaId: null, oposicionId,
      numeroPreguntas: 10, dificultad: 'mixto',
      motivo: accesos.length === 0
        ? 'Accede al catalogo para comprar tu primera oposicion.'
        : 'Empieza con un test rapido de 10 preguntas adaptado a tu nivel.',
    });
  },
};