export const testSubmitScoringNotaService = {
  calcNota({ aciertos, errores, total }) {
    const netas = aciertos - errores * 0.33;
    return Number(Math.max(0, (netas / total) * 10).toFixed(2));
  },
};