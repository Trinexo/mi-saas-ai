import pool from '../config/db.js';

export const settingsRepository = {
  /** Devuelve todas las filas de configuracion_sistema */
  async getAll() {
    const { rows } = await pool.query(
      `SELECT clave, valor, es_secreto, descripcion, actualizado_en
       FROM configuracion_sistema
       ORDER BY clave`,
    );
    return rows;
  },

  /**
   * Inserta o actualiza múltiples claves en una sola query.
   * @param {Array<{clave: string, valor: string}>} entries
   */
  async upsertMany(entries) {
    if (entries.length === 0) return;

    const values = entries.flatMap(({ clave, valor }) => [clave, valor]);
    const placeholders = entries
      .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
      .join(', ');

    await pool.query(
      `INSERT INTO configuracion_sistema (clave, valor)
       VALUES ${placeholders}
       ON CONFLICT (clave)
       DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = NOW()`,
      values,
    );
  },
};
