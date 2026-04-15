import { testRecomendadoRepository } from '../repositories/testRecomendado.repository.js';
import { authRepository } from '../repositories/auth.repository.js';
import { PLAN_LIMITS } from '../config/plans.config.js';

/**
 * Genera una sugerencia de test personalizada para el usuario basada en:
 * 1. Si tiene repaso pendiente → modo repaso (solo plan pro+)
 * 2. Si tiene tema con >30% error → modo adaptativo en ese tema
 * 3. Si es usuario nuevo (<3 tests) → modo normal en tema con menos vistas
 * 4. Fallback → modo adaptativo con oposición preferida
 */
export const testRecomendadoService = {
  async getSugerencia(userId, plan = 'free') {
    const limits = PLAN_LIMITS[plan];

    // Obtener oposición preferida del usuario
    const user = await authRepository.getUserById(userId);
    const oposicionId = user?.oposicion_preferida_id ?? null;

    // 1. Repaso pendiente (solo si el plan lo permite)
    if (limits.repasoEspaciado) {
      const pendientes = await testRecomendadoRepository.contarRepasoPendiente(userId);
      if (pendientes >= 3) {
        return {
          modo: 'repaso',
          temaId: null,
          oposicionId: oposicionId ? Number(oposicionId) : null,
          numeroPreguntas: Math.min(pendientes, 20),
          dificultad: 'mixto',
          motivo: `Tienes ${pendientes} preguntas pendientes de repaso. ¡Buen momento para repasar!`,
        };
      }
    }

    // 2. Tema con mayor tasa de error
    const temaError = await testRecomendadoRepository.temaConMasErrores(userId, oposicionId);
    if (temaError && temaError.tasaError >= 30) {
      return {
        modo: 'adaptativo',
        temaId: temaError.temaId,
        oposicionId: oposicionId ? Number(oposicionId) : null,
        numeroPreguntas: 10,
        dificultad: 'mixto',
        motivo: `Tasa de error del ${temaError.tasaError}% en "${temaError.temaNombre}". ¡Perfecto para reforzarlo!`,
      };
    }

    // 3. Usuario nuevo: tema con menos vistas
    const totalTests = await testRecomendadoRepository.contarTests(userId);
    if (totalTests < 3) {
      const temaNuevo = await testRecomendadoRepository.temaConMenosVistas(userId, oposicionId);
      if (temaNuevo) {
        return {
          modo: 'normal',
          temaId: temaNuevo.temaId,
          oposicionId: oposicionId ? Number(oposicionId) : null,
          numeroPreguntas: 10,
          dificultad: 'mixto',
          motivo: `Aún no has practicado "${temaNuevo.temaNombre}". ¡Empieza hoy!`,
        };
      }
    }

    // 4. Explorar tema menos visto
    if (oposicionId) {
      const temaMenosVisto = await testRecomendadoRepository.temaConMenosVistas(userId, oposicionId);
      if (temaMenosVisto) {
        return {
          modo: 'adaptativo',
          temaId: temaMenosVisto.temaId,
          oposicionId: Number(oposicionId),
          numeroPreguntas: 10,
          dificultad: 'mixto',
          motivo: `El tema "${temaMenosVisto.temaNombre}" todavía tiene preguntas por descubrir.`,
        };
      }
    }

    // 5. Fallback genérico
    return {
      modo: 'adaptativo',
      temaId: null,
      oposicionId: oposicionId ? Number(oposicionId) : null,
      numeroPreguntas: 10,
      dificultad: 'mixto',
      motivo: 'Empieza con un test rápido de 10 preguntas adaptado a tu nivel.',
    };
  },
};
