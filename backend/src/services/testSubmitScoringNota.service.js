export const testSubmitScoringNotaService = {
  getPenalizacionPorOpciones(totalOpciones) {
    const opciones = Number(totalOpciones);
    if (!Number.isFinite(opciones) || opciones <= 1) return 0;
    return 1 / (opciones - 1);
  },

  calcNota({ aciertos, errores, total, penalizacionErrores }) {
    const penalizacionTotal = Array.isArray(penalizacionErrores)
      ? penalizacionErrores.reduce((sum, penalizacion) => sum + Number(penalizacion || 0), 0)
      : errores * Number(penalizacionErrores ?? 0.33);
    const netas = aciertos - penalizacionTotal;
    return Number(Math.max(0, (netas / total) * 10).toFixed(2));
  },
};
