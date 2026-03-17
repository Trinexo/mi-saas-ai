import pool from '../config/db.js';

/*
 * Intervalos de revisión por nivel:
 *   nivel 0 → 1 día   (fallo o primer acierto)
 *   nivel 1 → 1 día
 *   nivel 2 → 3 días
 *   nivel 3 → 7 días
 *   nivel 4 → 14 días
 *   nivel 5 → 30 días  (tope)
 */
const INTERVALOS_DIAS = [1, 1, 3, 7, 14, 30];
const NIVEL_MAX = INTERVALOS_DIAS.length - 1;

const intervaloDias = (nivel) => INTERVALOS_DIAS[Math.min(nivel, NIVEL_MAX)];

const UPSERT_REPASO_SQL = `
  INSERT INTO repeticion_espaciada
    (usuario_id, pregunta_id, nivel_memoria, proxima_revision, ultima_revision, racha_aciertos)
  VALUES
    ($1, $2, $3, NOW() + ($4 || ' days')::INTERVAL, NOW(), $5)
  ON CONFLICT (usuario_id, pregunta_id) DO UPDATE SET
    nivel_memoria     = EXCLUDED.nivel_memoria,
    proxima_revision  = EXCLUDED.proxima_revision,
    ultima_revision   = NOW(),
    racha_aciertos    = EXCLUDED.racha_aciertos
`;

const GET_NIVEL_SQL = `
  SELECT nivel_memoria, racha_aciertos
  FROM repeticion_espaciada
  WHERE usuario_id = $1 AND pregunta_id = $2
`;

export const spacedRepetitionRepository = {
  async upsertRepaso({ userId, preguntaId, correcta }) {
    // Leer el estado actual si existe
    const current = await pool.query(GET_NIVEL_SQL, [userId, preguntaId]);
    const row = current.rows[0];

    let nivelActual = row ? row.nivel_memoria : 0;
    let rachaActual = row ? row.racha_aciertos : 0;

    let nuevoNivel;
    let nuevaRacha;

    if (correcta) {
      nuevoNivel = Math.min(nivelActual + 1, NIVEL_MAX);
      nuevaRacha = rachaActual + 1;
    } else {
      nuevoNivel = 0;
      nuevaRacha = 0;
    }

    const dias = intervaloDias(nuevoNivel);

    await pool.query(UPSERT_REPASO_SQL, [userId, preguntaId, nuevoNivel, dias, nuevaRacha]);
  },

  // Expuesto para tests
  _intervaloDias: intervaloDias,
  _NIVEL_MAX: NIVEL_MAX,
};
