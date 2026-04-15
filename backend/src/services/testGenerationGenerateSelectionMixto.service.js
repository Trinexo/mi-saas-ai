import { testQuestionsAdaptiveRepository } from '../repositories/testQuestionsAdaptive.repository.js';
import { testQuestionsThemeRepository } from '../repositories/testQuestionsTheme.repository.js';

/**
 * Genera un test mezclando preguntas de varios temas según cuotas porcentuales.
 *
 * @param {object} params
 * @param {number} params.userId
 * @param {Array<{temaId: number, pct: number}>} params.temasMix  - Array de {temaId, pct} donde la suma de pct debe ser ~100
 * @param {number} params.numeroPreguntas
 * @param {string} params.modo  - 'adaptativo' | 'normal'
 * @param {string} params.dificultad
 */
export const testGenerationGenerateSelectionMixtoService = {
  async pickMixto({ userId, temasMix, numeroPreguntas, modo = 'adaptativo', dificultad = 'mixto' }) {
    // Calcula cuántas preguntas corresponden a cada tema (reparte el sobrante al mayor pct)
    const cuotas = calcCuotasAbsolutas(temasMix, numeroPreguntas);

    const picks = await Promise.all(
      cuotas.map(({ temaId, cantidad }) => {
        if (cantidad <= 0) return Promise.resolve([]);
        if (modo === 'adaptativo') {
          return testQuestionsAdaptiveRepository.pickAdaptiveQuestions({
            userId,
            temaId,
            numeroPreguntas: cantidad,
            excludePreguntaIds: [],
            nivelDificultad: null,
          });
        }
        return testQuestionsThemeRepository.pickFreshQuestions({
          userId,
          temaId,
          numeroPreguntas: cantidad,
          nivelDificultad: null,
        });
      }),
    );

    // Mezcla aleatoria de todos los grupos
    const todas = picks.flat();
    return shuffle(todas);
  },
};

// ---------- helpers ----------

function calcCuotasAbsolutas(temasMix, total) {
  const cuotas = temasMix.map(({ temaId, pct }) => ({
    temaId,
    cantidad: Math.floor((pct / 100) * total),
  }));

  // Reparte el sobrante al tema con mayor pct
  const asignadas = cuotas.reduce((s, c) => s + c.cantidad, 0);
  const sobrante = total - asignadas;
  if (sobrante > 0) {
    const idx = temasMix.reduce((best, t, i) => (t.pct > temasMix[best].pct ? i : best), 0);
    cuotas[idx].cantidad += sobrante;
  }

  return cuotas;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
