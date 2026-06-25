export const testSubmitScoringNotaService = {
  getPenalizacionPorOpciones(totalOpciones) {
    const opciones = Number(totalOpciones);
    if (!Number.isFinite(opciones) || opciones <= 1) return 0;
    return 1 / (opciones - 1);
  },

  calcNotaSnapshot({ aciertos, errores, blancos, total, scoringSnapshot }) {
    if (!scoringSnapshot || total <= 0) return null;

    const source = scoringSnapshot.source;
    if (source === 'admin_test') {
      const ptsAcierto = Number(scoringSnapshot.pts_acierto ?? 1);
      const ptsFallo = Number(scoringSnapshot.pts_fallo ?? -0.25);
      const ptsBlanco = Number(scoringSnapshot.pts_blanco ?? 0);
      const maxScore = total * Math.max(ptsAcierto, 0);
      if (!Number.isFinite(maxScore) || maxScore <= 0) return null;

      const score = (aciertos * ptsAcierto) + (errores * ptsFallo) + (blancos * ptsBlanco);
      return Number(Math.max(0, Math.min(10, (score / maxScore) * 10)).toFixed(2));
    }

    if (source === 'simulacro') {
      const penalizacion = Math.abs(Number(scoringSnapshot.penalizacion ?? 0));
      const score = aciertos - (errores * penalizacion);
      return Number(Math.max(0, Math.min(10, (score / total) * 10)).toFixed(2));
    }

    return null;
  },

  calcNota({ aciertos, errores, total, penalizacionErrores }) {
    const penalizacionTotal = Array.isArray(penalizacionErrores)
      ? penalizacionErrores.reduce((sum, penalizacion) => sum + Number(penalizacion || 0), 0)
      : errores * Number(penalizacionErrores ?? 0.33);
    const netas = aciertos - penalizacionTotal;
    return Number(Math.max(0, (netas / total) * 10).toFixed(2));
  },
};
