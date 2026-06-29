import { testRecomendadoRepository } from '../repositories/testRecomendado.repository.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { PLAN_LIMITS } from '../config/plans.config.js';

export const testRecomendadoService = {
  async getSugerencia(userId, plan = 'free', options = {}) {
    const limits = PLAN_LIMITS[plan];
    const requestedOposicionId = options?.oposicionId ? Number(options.oposicionId) : null;

    const accesos = await accesoOposicionRepository.getAccesosActivos(userId);
    const accesoActivo = requestedOposicionId
      ? await accesoOposicionRepository.getPreparacion(userId, requestedOposicionId)
      : accesos[0];
    const oposicionId = accesoActivo ? Number(accesoActivo.oposicion_id) : null;
    const oposicionNombre = accesoActivo?.nombre ?? await testRecomendadoRepository.getNombreOposicion(oposicionId);

    const s = (campos) => ({ oposicionNombre, ...campos });

    if (requestedOposicionId && !accesoActivo) {
      return s({
        modo: 'adaptativo', bloqueId: null, oposicionId: null,
        numeroPreguntas: 10, dificultad: 'mixto',
        motivo: 'Accede al catalogo para comprar esta oposicion.',
      });
    }

    if (accesoActivo?.modo_preparacion === 'albacer') {
      return s({
        modo: 'albacer', bloqueId: null, oposicionId,
        numeroPreguntas: 0, dificultad: 'mixto',
        motivo: 'Continua tu preparacion desde los modulos Albacer de esta oposicion.',
      });
    }

    // Bloques practicados en las últimas 24h — se usan para evitar recomendar el mismo
    const recientes = await testRecomendadoRepository.bloquesRecientesPracticados(userId, 24, oposicionId);

    if (limits.repasoEspaciado) {
      const bloqueRepaso = await testRecomendadoRepository.bloqueConMasRepasoPendiente(userId, oposicionId);
      if (bloqueRepaso && bloqueRepaso.pendientes >= 3) {
        return s({
          modo: 'repaso', bloqueId: bloqueRepaso.bloqueId, oposicionId,
          numeroPreguntas: Math.min(bloqueRepaso.pendientes, 20), dificultad: 'mixto',
          motivo: `Tienes ${bloqueRepaso.pendientes} preguntas pendientes de repaso en "${bloqueRepaso.bloqueNombre}".`,
        });
      }
    }

    // Busca el bloque con más errores excluyendo los recientes; si no hay, sin exclusión
    const bloqueError = await testRecomendadoRepository.bloqueConMasErrores(userId, oposicionId, recientes)
      ?? await testRecomendadoRepository.bloqueConMasErrores(userId, oposicionId);
    if (bloqueError && bloqueError.tasaError >= 30) {
      // Si además hay un bloque sin explorar, mezcla: 60% errores + 40% nuevo
      const bloqueNuevo = await testRecomendadoRepository.bloqueConMenosVistas(
        userId, oposicionId, [...recientes, bloqueError.bloqueId],
      ) ?? await testRecomendadoRepository.bloqueConMenosVistas(userId, oposicionId, [bloqueError.bloqueId]);
      if (bloqueNuevo && bloqueNuevo.bloqueId !== bloqueError.bloqueId) {
        return s({
          modo: 'adaptativo', bloqueId: null, oposicionId,
          temasMix: [
            { bloqueId: bloqueError.bloqueId, pct: 60 },
            { bloqueId: bloqueNuevo.bloqueId, pct: 40 },
          ],
          numeroPreguntas: 10, dificultad: 'mixto',
          motivo: `Refuerza "${bloqueError.bloqueNombre}" (${bloqueError.tasaError}% error) y descubre "${bloqueNuevo.bloqueNombre}".`,
        });
      }
      return s({
        modo: 'adaptativo', bloqueId: bloqueError.bloqueId, oposicionId,
        numeroPreguntas: 10, dificultad: 'mixto',
        motivo: `Tasa de error del ${bloqueError.tasaError}% en "${bloqueError.bloqueNombre}". Refuerzalo.`,
      });
    }

    const totalTests = await testRecomendadoRepository.contarTests(userId, oposicionId);
    if (oposicionId && totalTests < 3) {
      const bloqueNuevo = await testRecomendadoRepository.bloqueConMenosVistas(userId, oposicionId, recientes)
        ?? await testRecomendadoRepository.bloqueConMenosVistas(userId, oposicionId);
      if (bloqueNuevo) {
        return s({
          modo: 'normal', bloqueId: bloqueNuevo.bloqueId, oposicionId,
          numeroPreguntas: 10, dificultad: 'mixto',
          motivo: `Aun no has practicado "${bloqueNuevo.bloqueNombre}". Empieza hoy.`,
        });
      }
    }

    if (oposicionId) {
      const bloqueMenosVisto = await testRecomendadoRepository.bloqueConMenosVistas(userId, oposicionId, recientes)
        ?? await testRecomendadoRepository.bloqueConMenosVistas(userId, oposicionId);
      if (bloqueMenosVisto) {
        return s({
          modo: 'adaptativo', bloqueId: bloqueMenosVisto.bloqueId, oposicionId,
          numeroPreguntas: 10, dificultad: 'mixto',
          motivo: `El bloque "${bloqueMenosVisto.bloqueNombre}" todavia tiene preguntas por descubrir.`,
        });
      }
    }

    return s({
      modo: 'adaptativo', bloqueId: null, oposicionId,
      numeroPreguntas: 10, dificultad: 'mixto',
      motivo: accesos.length === 0
        ? 'Accede al catalogo para comprar tu primera oposicion.'
        : 'Empieza con un test rapido de 10 preguntas adaptado a tu nivel.',
    });
  },
};
