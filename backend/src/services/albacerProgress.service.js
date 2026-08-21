import { albacerProgressRepository } from '../repositories/albacerProgress.repository.js';

const DEFAULT_PASS_NOTA = 5;
const DEFAULT_PASS_PERCENT = 50;
export const MANDATORY_ITEM_PASS_NOTA = 5;

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const albacerProgressService = {
  async processAttempt({ userId, testId, aciertos, nota }) {
    const context = await albacerProgressRepository.getAttemptContext(userId, testId);
    if (!context) return null;

    if (context.item_tipo === 'test') {
      if (!context.obligatorio) return null;
      const progreso = await albacerProgressRepository.refreshMandatoryItemProgress(userId, testId);
      if (!progreso) return null;
      return {
        tipo: 'test_obligatorio',
        moduloId: Number(context.albacer_modulo_id),
        itemId: Number(context.albacer_item_id),
        criterioSuperacion: 'nota',
        valorSuperacion: MANDATORY_ITEM_PASS_NOTA,
        nota: Number(Number(nota ?? 0).toFixed(2)),
        superadoIntento: Number(nota ?? 0) >= MANDATORY_ITEM_PASS_NOTA,
        superado: Boolean(progreso.superado),
        intentos: Number(progreso.intentos),
        mejorNota: progreso.mejor_nota == null ? null : Number(progreso.mejor_nota),
        ultimaNota: progreso.ultima_nota == null ? null : Number(progreso.ultima_nota),
      };
    }

    if (context.item_tipo !== 'simulacro_final') return null;

    const totalPreguntas = Math.max(1, Number(context.numero_preguntas ?? 0));
    const porcentaje = Number(((Number(aciertos ?? 0) / totalPreguntas) * 100).toFixed(2));
    const criterio = context.criterio_superacion === 'porcentaje' ? 'porcentaje' : 'nota';
    const valorSuperacion = context.valor_superacion == null
      ? (criterio === 'porcentaje' ? DEFAULT_PASS_PERCENT : DEFAULT_PASS_NOTA)
      : toNumber(context.valor_superacion);

    const notaFinal = Number(Number(nota ?? 0).toFixed(2));
    const superado = criterio === 'porcentaje'
      ? porcentaje >= valorSuperacion
      : notaFinal >= valorSuperacion;

    const progreso = await albacerProgressRepository.upsertFinalAttemptProgress({
      userId,
      moduloId: Number(context.albacer_modulo_id),
      testId,
      nota: notaFinal,
      porcentaje,
      superado,
    });

    const itemsCompletados = superado
      ? await albacerProgressRepository.completeModuleItemsFromFinal(
        userId,
        Number(context.albacer_modulo_id),
      )
      : [];

    const siguienteModuloId = superado
      ? await albacerProgressRepository.unlockNextModulo(userId, Number(context.albacer_modulo_id))
      : null;

    return {
      moduloId: Number(context.albacer_modulo_id),
      itemId: Number(context.albacer_item_id),
      simulacroId: Number(context.simulacro_id),
      criterioSuperacion: criterio,
      valorSuperacion,
      nota: notaFinal,
      porcentaje,
      superado,
      mejorNota: progreso?.mejor_nota == null ? notaFinal : Number(progreso.mejor_nota),
      mejorPorcentaje: progreso?.mejor_porcentaje == null ? porcentaje : Number(progreso.mejor_porcentaje),
      itemsCompletados,
      siguienteModuloId,
    };
  },

  async processFinalAttempt(payload) {
    return this.processAttempt(payload);
  },
};
