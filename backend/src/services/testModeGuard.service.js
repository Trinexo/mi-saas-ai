import pool from '../config/db.js';
import { accessContextService, normalizarIdentificador } from './accessContext.service.js';
import { ApiError } from '../utils/api-error.js';

const uniquePositiveIds = (values) => (
  Array.from(new Map(values.flatMap((value) => {
    try {
      const normalized = normalizarIdentificador(value, 'oposicionId');
      return [[String(normalized), normalized]];
    } catch {
      return [];
    }
  })).values())
);

export const testModeGuardService = {
  async resolveOposicionIdsForGenerate(payload = {}) {
    const directIds = payload.oposicionId ? [payload.oposicionId] : [];
    const temaIds = uniquePositiveIds([
      payload.temaId,
      ...(Array.isArray(payload.temasMix) ? payload.temasMix.map((item) => item?.temaId) : []),
    ]);
    const bloqueIds = uniquePositiveIds([payload.bloqueId]);

    if (temaIds.length === 0 && bloqueIds.length === 0) return uniquePositiveIds(directIds);

    const result = temaIds.length > 0
      ? await pool.query(
        'SELECT DISTINCT oposicion_id FROM temas WHERE id = ANY($1::bigint[])',
        [temaIds],
      )
      : { rows: [] };

    const bloquesResult = bloqueIds.length > 0
      ? await pool.query(
        `SELECT DISTINCT t.oposicion_id
         FROM bloques b
         JOIN temas t ON t.id = b.tema_id
         WHERE b.id = ANY($1::bigint[])`,
        [bloqueIds],
      )
      : { rows: [] };

    return uniquePositiveIds([
      ...directIds,
      ...result.rows.map((row) => row.oposicion_id),
      ...bloquesResult.rows.map((row) => row.oposicion_id),
    ]);
  },

  async getModoPreparacion(userId, oposicionId) {
    if (!oposicionId) return null;
    const contexto = await accessContextService.obtenerContextoUsuario({
      usuarioId: userId,
      oposicionId,
      principal: { tipo: 'alumno', usuarioId: userId },
    });
    if (contexto.modo_activo === 'guiado' && contexto.permisos.puede_usar_guiado) return 'albacer';
    if (contexto.modo_activo === 'experto' && contexto.permisos.puede_usar_experto) return 'experto';
    return null;
  },

  async assertAlumnoCanGenerateFreeTest(user, payload = {}) {
    if (!user || ['admin', 'profesor'].includes(user.role)) return;

    const oposicionIds = await this.resolveOposicionIdsForGenerate(payload);
    const contextos = await accessContextService.obtenerContextosUsuario({ usuarioId: user.userId });
    const byOposicion = new Map(contextos.map((contexto) => [String(contexto.oposicion_id), contexto]));
    for (const oposicionId of oposicionIds) {
      const contexto = byOposicion.get(String(oposicionId));
      if (contexto?.modo_activo === 'guiado' && contexto.permisos.puede_usar_guiado) {
        throw new ApiError(
          403,
          'Esta oposicion esta en Modo Albacer. Inicia los tests desde el modulo Albacer, no desde el generador libre.',
          { code: 'ALBACER_FREE_TEST_BLOCKED', oposicionId },
        );
      }
    }
  },
};
