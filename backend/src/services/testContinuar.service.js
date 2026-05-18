import pool from '../config/db.js';
import { testSessionDetailConfigRepository } from '../repositories/testSessionDetailConfig.repository.js';
import { accesoOposicionRepository } from '../repositories/accesoOposicion.repository.js';

export const testContinuarService = {
  async getContinuar(userId) {
    const accesos = await accesoOposicionRepository.getAccesosActivos(userId);
    const oposicionId = accesos.length > 0 ? Number(accesos[0].oposicion_id) : null;

    /* ── 1. Test sin terminar ─────────────────────────────── */
    const pendienteRes = await pool.query(
      `SELECT t.id, t.numero_preguntas, t.tipo_test,
              op.nombre AS oposicion_nombre,
              te.nombre AS tema_nombre
       FROM tests t
       LEFT JOIN oposiciones op ON op.id = t.oposicion_id
       LEFT JOIN temas       te ON te.id = t.tema_id
       WHERE t.usuario_id = $1
         AND t.estado = 'generado'
         AND EXISTS (
           SELECT 1 FROM respuestas_usuario ru WHERE ru.test_id = t.id
         )
         AND NOT EXISTS (
           SELECT 1 FROM tests t2
           WHERE t2.usuario_id = $1
             AND t2.estado    = 'finalizado'
             AND t2.fecha_creacion > t.fecha_creacion
             AND (
               (t.oposicion_id IS NOT NULL AND t2.oposicion_id = t.oposicion_id)
               OR (t.tema_id IS NOT NULL AND t2.tema_id = t.tema_id)
             )
         )
       ORDER BY t.fecha_creacion DESC
       LIMIT 1`,
      [userId],
    );

    if (pendienteRes.rows.length > 0) {
      const row = pendienteRes.rows[0];
      const config = await testSessionDetailConfigRepository.getTestConfig(userId, Number(row.id));
      return {
        tipo: 'retomar',
        testId: Number(row.id),
        titulo: row.oposicion_nombre || row.tema_nombre || 'Test pendiente',
        subtitulo: row.tema_nombre || null,
        motivo: `Tienes un test de ${row.numero_preguntas} preguntas sin terminar`,
        config,
      };
    }

    if (!oposicionId) {
      return {
        tipo: 'empezar',
        titulo: null,
        motivo: 'Accede al catálogo para empezar tu primera oposición.',
        config: null,
      };
    }

    /* ── 2. Tema con peor tasa de acierto (< 90%, ≥1 intento) ─ */
    const peorTemaRes = await pool.query(
      `SELECT t.id, t.nombre,
              COUNT(ru.id)                                                        AS intentos,
              ROUND(
                100.0 * SUM(CASE WHEN ru.correcta THEN 1 ELSE 0 END)
                / NULLIF(COUNT(ru.id), 0)
              )                                                                   AS pct_aciertos
       FROM temas t
       JOIN preguntas p          ON p.tema_id  = t.id
       JOIN respuestas_usuario ru ON ru.pregunta_id = p.id
       JOIN tests ts              ON ts.id = ru.test_id AND ts.usuario_id = $1
       WHERE t.oposicion_id = $2
       GROUP BY t.id, t.nombre
       HAVING COUNT(ru.id) > 0
          AND ROUND(
                100.0 * SUM(CASE WHEN ru.correcta THEN 1 ELSE 0 END)
                / NULLIF(COUNT(ru.id), 0)
              ) < 90
       ORDER BY pct_aciertos ASC
       LIMIT 1`,
      [userId, oposicionId],
    );

    if (peorTemaRes.rows.length > 0) {
      const t = peorTemaRes.rows[0];
      return {
        tipo: 'mejorar',
        temaId: Number(t.id),
        oposicionId,
        titulo: t.nombre,
        pctAciertos: Number(t.pct_aciertos),
        motivo: `Solo tienes un ${t.pct_aciertos}% de acierto en este tema. ¡Puedes mejorarlo!`,
        config: null,
      };
    }

    /* ── 3. Siguiente tema sin iniciar ───────────────────────── */
    const siguienteRes = await pool.query(
      `SELECT t.id, t.nombre
       FROM temas t
       WHERE t.oposicion_id = $1
         AND NOT EXISTS (
           SELECT 1
           FROM preguntas p
           JOIN respuestas_usuario ru ON ru.pregunta_id = p.id
           JOIN tests ts              ON ts.id = ru.test_id AND ts.usuario_id = $2
           WHERE p.tema_id = t.id
         )
       ORDER BY t.nombre ASC
       LIMIT 1`,
      [oposicionId, userId],
    );

    if (siguienteRes.rows.length > 0) {
      const t = siguienteRes.rows[0];
      return {
        tipo: 'siguiente',
        temaId: Number(t.id),
        oposicionId,
        titulo: t.nombre,
        motivo: 'Aún no has practicado este tema. ¡Empiézalo hoy!',
        config: null,
      };
    }

    /* ── 4. Todo al 90%+ → repaso general ───────────────────── */
    return {
      tipo: 'repaso',
      temaId: null,
      oposicionId,
      titulo: '¡Gran nivel!',
      motivo: 'Todos los temas superan el 90% de acierto. Haz un repaso para afianzar.',
      config: null,
    };
  },
};
