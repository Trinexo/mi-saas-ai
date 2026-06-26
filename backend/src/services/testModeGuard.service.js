import pool from '../config/db.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';
import { ApiError } from '../utils/api-error.js';

const uniqueNumbers = (values) => (
  Array.from(new Set(values.map(Number).filter((value) => Number.isInteger(value) && value > 0)))
);

export const testModeGuardService = {
  async resolveOposicionIdsForGenerate(payload = {}) {
    const directIds = payload.oposicionId ? [Number(payload.oposicionId)] : [];
    const temaIds = uniqueNumbers([
      payload.temaId,
      ...(Array.isArray(payload.temasMix) ? payload.temasMix.map((item) => item?.temaId) : []),
    ]);

    if (temaIds.length === 0) return uniqueNumbers(directIds);

    const result = await pool.query(
      'SELECT DISTINCT oposicion_id FROM temas WHERE id = ANY($1::bigint[])',
      [temaIds],
    );

    return uniqueNumbers([
      ...directIds,
      ...result.rows.map((row) => row.oposicion_id),
    ]);
  },

  async assertAlumnoCanGenerateFreeTest(user, payload = {}) {
    if (!user || ['admin', 'profesor'].includes(user.role)) return;

    const oposicionIds = await this.resolveOposicionIdsForGenerate(payload);
    for (const oposicionId of oposicionIds) {
      const acceso = await accesoOposicionRepository.getPreparacion(user.userId, oposicionId);
      if (acceso?.modo_preparacion === 'albacer') {
        throw new ApiError(
          403,
          'Esta oposicion esta en Modo Albacer. Inicia los tests desde el modulo Albacer, no desde el generador libre.',
          { code: 'ALBACER_FREE_TEST_BLOCKED', oposicionId },
        );
      }
    }
  },
};
