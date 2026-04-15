import pool from '../config/db.js';

export const subscriptionRepository = {
  /**
   * Devuelve el plan activo del usuario o null si no tiene suscripción activa.
   * Considera expiración automática por fecha_fin.
   */
  async getActivePlan(userId) {
    const result = await pool.query(
      `SELECT plan FROM suscripciones
       WHERE usuario_id = $1
         AND estado = 'activa'
         AND (fecha_fin IS NULL OR fecha_fin > NOW())
       ORDER BY fecha_inicio DESC
       LIMIT 1`,
      [userId],
    );
    return result.rows[0]?.plan ?? 'free';
  },

  /**
   * Devuelve el historial de suscripciones del usuario.
   */
  async getHistory(userId) {
    const result = await pool.query(
      `SELECT id, plan, estado, fecha_inicio, fecha_fin, creada_en
       FROM suscripciones
       WHERE usuario_id = $1
       ORDER BY fecha_inicio DESC`,
      [userId],
    );
    return result.rows;
  },

  /**
   * Crea una nueva suscripción para el usuario.
   * Si el usuario ya tiene una suscripción activa del mismo plan, devuelve la existente.
   */
  async create({ userId, plan, fechaFin = null, notas = null }) {
    const result = await pool.query(
      `INSERT INTO suscripciones (usuario_id, plan, estado, fecha_inicio, fecha_fin, notas)
       VALUES ($1, $2, 'activa', NOW(), $3, $4)
       RETURNING id, usuario_id, plan, estado, fecha_inicio, fecha_fin, creada_en`,
      [userId, plan, fechaFin, notas],
    );
    return result.rows[0];
  },

  /**
   * Cancela todas las suscripciones activas del usuario (antes de asignar una nueva).
   */
  async cancelActive(userId) {
    await pool.query(
      `UPDATE suscripciones
       SET estado = 'cancelada', actualizada_en = NOW()
       WHERE usuario_id = $1 AND estado = 'activa'`,
      [userId],
    );
  },

  /**
   * Expira suscripciones cuya fecha_fin ha pasado (para uso por job o manualmente).
   */
  async expireOutdated() {
    const result = await pool.query(
      `UPDATE suscripciones
       SET estado = 'expirada', actualizada_en = NOW()
       WHERE estado = 'activa'
         AND fecha_fin IS NOT NULL
         AND fecha_fin <= NOW()
       RETURNING id`,
    );
    return result.rowCount;
  },

  /**
   * Estadísticas globales de suscripciones para el panel de admin.
   */
  async getStats() {
    // Distribución de planes activos
    const porPlanRes = await pool.query(
      `SELECT plan, COUNT(*)::int AS total
       FROM suscripciones
       WHERE estado = 'activa'
         AND (fecha_fin IS NULL OR fecha_fin > NOW())
       GROUP BY plan`,
    );

    // Total usuarios registrados
    const totalUsersRes = await pool.query(`SELECT COUNT(*)::int AS total FROM usuarios`);

    // Nuevas suscripciones (excluyendo free) en los últimos 7 y 30 días
    const nuevasRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE creada_en >= NOW() - INTERVAL '7 days')::int  AS nuevas_7d,
         COUNT(*) FILTER (WHERE creada_en >= NOW() - INTERVAL '30 days')::int AS nuevas_30d
       FROM suscripciones
       WHERE plan != 'free'`,
    );

    const porPlan = { free: 0, pro: 0, elite: 0 };
    let totalConPlan = 0;
    for (const row of porPlanRes.rows) {
      porPlan[row.plan] = row.total;
      if (row.plan !== 'free') totalConPlan += row.total;
    }

    const totalUsuarios = totalUsersRes.rows[0]?.total ?? 0;
    const { nuevas_7d, nuevas_30d } = nuevasRes.rows[0] ?? {};

    return {
      porPlan,
      totalConPlan,
      totalUsuarios,
      nuevas7d: nuevas_7d ?? 0,
      nuevas30d: nuevas_30d ?? 0,
      tasaConversion: totalUsuarios > 0 ? Math.round((totalConPlan / totalUsuarios) * 100 * 10) / 10 : 0,
    };
  },

  /**
   * Lista de suscripciones para el panel de admin.
   */
  async listAll({ limit = 50, offset = 0, plan, estado }) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (plan) { conditions.push(`s.plan = $${idx++}`); values.push(plan); }
    if (estado) { conditions.push(`s.estado = $${idx++}`); values.push(estado); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const result = await pool.query(
      `SELECT s.id, s.usuario_id, u.nombre, u.email, s.plan, s.estado,
              s.fecha_inicio, s.fecha_fin, s.notas, s.creada_en
       FROM suscripciones s
       JOIN usuarios u ON u.id = s.usuario_id
       ${where}
       ORDER BY s.creada_en DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    );
    return result.rows;
  },
};
