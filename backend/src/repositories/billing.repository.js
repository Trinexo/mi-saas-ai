import pool from '../config/db.js';

export const billingRepository = {
  async withTransaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

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
  async registrarStripeSession(userId, oposicionId, stripeSessionId, client = pool) {
    await client.query(
      `UPDATE accesos_oposicion
       SET stripe_session_id = $3
       WHERE usuario_id = $1 AND oposicion_id = $2`,
      [userId, oposicionId, stripeSessionId],
    );
  },

  async registerStripeWebhookEvent(client, {
    eventId,
    eventType,
    objectId,
    livemode,
    createdAt,
  }) {
    const result = await client.query(
      `INSERT INTO stripe_webhook_events
         (event_id, event_type, object_id, livemode, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING
       RETURNING event_id`,
      [eventId, eventType, objectId, livemode, createdAt],
    );
    return result.rowCount === 1;
  },

  async markStripeWebhookEventProcessed(client, eventId) {
    const result = await client.query(
      `UPDATE stripe_webhook_events
       SET processed_at = NOW()
       WHERE event_id = $1
       RETURNING event_id, processed_at`,
      [eventId],
    );
    return result.rows[0] ?? null;
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
