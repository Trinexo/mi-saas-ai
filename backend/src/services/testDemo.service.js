import { adminTestsService } from './adminTests.service.js';
import { testGenerationGeneratePersistenceService } from './testGenerationGeneratePersistence.service.js';
import { ApiError } from '../utils/api-error.js';
import pool from '../config/db.js';

const SELECT_BY_IDS_SQL = `
  SELECT p.id, p.enunciado, p.explicacion, p.nivel_dificultad, p.imagen_url, p.audio_url,
         json_agg(json_build_object('id', o.id, 'texto', o.texto) ORDER BY o.id) AS opciones
  FROM preguntas p
  JOIN opciones_respuesta o ON o.pregunta_id = p.id
  WHERE p.id = ANY($1::bigint[])
  GROUP BY p.id
`;

export const testDemoService = {
  async generateDemo({ userId, oposicionId }) {
    if (!oposicionId) throw new ApiError(400, 'oposicionId es requerido');

    const { preguntaIds } = await adminTestsService.getDemoPreguntaIds(oposicionId);

    if (!preguntaIds || preguntaIds.length === 0) {
      throw new ApiError(404, 'Esta oposición no tiene preguntas disponibles para el demo');
    }

    const result = await pool.query(SELECT_BY_IDS_SQL, [preguntaIds]);
    // Preservar el orden de los IDs
    const preguntaMap = Object.fromEntries(result.rows.map((p) => [p.id, p]));
    const preguntas = preguntaIds.map((id) => preguntaMap[id]).filter(Boolean);

    if (preguntas.length === 0) {
      throw new ApiError(404, 'No se encontraron preguntas para el demo');
    }

    return testGenerationGeneratePersistenceService.persistAndBuildResponse({
      userId,
      temaId: null,
      oposicionId,
      modo: 'estandar',
      dificultad: 'mixto',
      duracionSegundos: null,
      feedbackInmediato: false,
      preguntas,
    });
  },
};
