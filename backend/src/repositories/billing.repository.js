import pool from '../config/db.js';

export const billingRepository = {
  /**
   * Devuelve una oposición con su precio actual.
   */
  async getOposicionConPrecio(oposicionId) {
    const result = await pool.query(
      `SELECT id, nombre, descripcion, precio_mensual_cents
       FROM oposiciones
       WHERE id = $1`,
      [oposicionId],
    );
    return result.rows[0] ?? null;
  },

  /**
   * Guarda el stripe_session_id en un acceso recién creado o actualizado.
   */
  async registrarStripeSession(userId, oposicionId, stripeSessionId) {
    await pool.query(
      `UPDATE accesos_oposicion
       SET stripe_session_id = $3
       WHERE usuario_id = $1 AND oposicion_id = $2`,
      [userId, oposicionId, stripeSessionId],
    );
  },

  /**
   * Devuelve el usuario asociado a un email (para usar en el webhook).
   */
  async getUserByEmail(email) {
    const result = await pool.query(
      `SELECT id FROM usuarios WHERE email = $1`,
      [email],
    );
    return result.rows[0] ?? null;
  },

  /**
   * Actualiza el precio_mensual_cents de una oposición.
   */
  async setPrecio(oposicionId, precioCents) {
    const result = await pool.query(
      `UPDATE oposiciones
       SET precio_mensual_cents = $2
       WHERE id = $1
       RETURNING id, nombre, precio_mensual_cents`,
      [oposicionId, precioCents],
    );
    return result.rows[0] ?? null;
  },
};
