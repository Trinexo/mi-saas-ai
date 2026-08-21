import { ApiError } from '../utils/api-error.js';
import pool from '../config/db.js';
import { createPreguntaSchema } from '../schemas/admin.schema.js';
import { adminPreguntasImportCsvService } from './adminPreguntasImportCsv.service.js';
import { adminPreguntasImportPersistService } from './adminPreguntasImportPersist.service.js';

export const adminPreguntasImportService = {
  async importPreguntasCsv(payload, caller = {}) {
    if (payload.oficial) return importOfficialBatch(payload, caller);
    const assignedIds = caller.role === 'profesor'
      ? await adminPreguntasImportPersistService.listAssignedOposiciones(caller.userId)
      : [];

    if (caller.role === 'profesor' && assignedIds.length === 0) {
      throw new ApiError(403, 'No tienes oposiciones asignadas');
    }

    const { delimiter, lines, indexes } = adminPreguntasImportCsvService.parseCsvPayload(payload);
    const errors = [];
    let inserted = 0;
    let firstInsertedTemaId = null;
    const estadoInicial = 'aprobada';

    for (let index = 1; index < lines.length; index += 1) {
      const line = lines[index];
      const values = adminPreguntasImportCsvService.parseRow(line, delimiter);
      const rowNumber = index + 1;

      try {
        const item = adminPreguntasImportCsvService.buildItem(values, indexes);

        const parsed = createPreguntaSchema.safeParse(item);
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          throw new Error(issue?.message || 'Fila inválida');
        }

        const temaExists = await adminPreguntasImportPersistService.ensureTemaExists(item.temaId);
        if (!temaExists) {
          throw new Error(`Tema ${item.temaId} no existe`);
        }

        if (caller.role === 'profesor') {
          const allowed = await adminPreguntasImportPersistService.ensureTemaInOposiciones(item.temaId, assignedIds);
          if (!allowed) {
            throw new Error(`Tema ${item.temaId} no pertenece a tus oposiciones asignadas`);
          }
        }

        if (item.coleccionId) {
          const colExistsResult = await pool.query(
            'SELECT id FROM colecciones WHERE id = $1 AND tema_id = $2',
            [item.coleccionId, item.temaId],
          );
          if (colExistsResult.rowCount === 0) {
            throw new Error(`Colección ${item.coleccionId} no existe o no pertenece al tema ${item.temaId}`);
          }
        }

        await adminPreguntasImportPersistService.insertPreguntaConOpciones({
          ...parsed.data,
          estado: estadoInicial,
        });
        if (firstInsertedTemaId === null) firstInsertedTemaId = item.temaId;
        inserted += 1;
      } catch (error) {
        errors.push({ row: rowNumber, message: error.message });
      }
    }

    let oposicionId = null;
    if (firstInsertedTemaId !== null) {
      const r = await pool.query('SELECT oposicion_id FROM temas WHERE id = $1', [firstInsertedTemaId]);
      oposicionId = r.rows[0]?.oposicion_id ?? null;
    }

    return {
      totalRows: lines.length - 1,
      imported: inserted,
      failed: errors.length,
      errors,
      oposicionId,
    };
  },
};

async function importOfficialBatch(payload, caller) {
  const client = await pool.connect();
  const { delimiter, lines, indexes } = adminPreguntasImportCsvService.parseCsvPayload(payload);
  const yearIds = payload.anioIds ?? [];
  const examIds = payload.examenIds ?? [];
  if (yearIds.length === 0) throw new ApiError(400, 'Debe indicar al menos un año oficial');
  try {
    await client.query('BEGIN');
    const yearResult = await client.query(
      `SELECT DISTINCT oposicion_id::text AS oposicion_id
         FROM oposiciones_anios_oficiales
        WHERE id = ANY($1::bigint[])`,
      [yearIds],
    );
    if (yearResult.rowCount !== 1) throw new ApiError(400, 'Los años oficiales deben pertenecer a una única oposición');
    const oposicionId = yearResult.rows[0].oposicion_id;
    if (examIds.length) {
      const examResult = await client.query(
        `SELECT id, oposicion_id::text AS oposicion_id, oposicion_anio_id::text AS oposicion_anio_id
           FROM examenes_oficiales WHERE id = ANY($1::bigint[])`, [examIds],
      );
      const uniqueExamIds = new Set(examIds.map(String));
      if (examResult.rowCount !== uniqueExamIds.size || examResult.rows.some((row) => (
        String(row.oposicion_id) !== String(oposicionId) || !yearIds.map(String).includes(String(row.oposicion_anio_id))
      ))) {
        throw new ApiError(400, 'Los exámenes oficiales no corresponden a los años seleccionados');
      }
    }
    if (caller.role === 'profesor') {
      const allowed = await adminPreguntasImportPersistService.listAssignedOposiciones(caller.userId);
      if (!allowed.map(String).includes(String(oposicionId))) throw new ApiError(403, 'La oposición no está asignada al profesor');
    }
    let imported = 0;
    for (let index = 1; index < lines.length; index += 1) {
      const item = adminPreguntasImportCsvService.buildItem(adminPreguntasImportCsvService.parseRow(lines[index], delimiter), indexes);
      const parsed = createPreguntaSchema.safeParse(item);
      if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message || `Fila ${index + 1} inválida`);
      const tema = await client.query('SELECT oposicion_id FROM temas WHERE id = $1', [item.temaId]);
      if (!tema.rowCount || String(tema.rows[0].oposicion_id) !== String(oposicionId)) throw new ApiError(400, `La fila ${index + 1} no pertenece a la oposición de los años oficiales`);
      const pregunta = await client.query(
        `INSERT INTO preguntas (tema_id, enunciado, explicacion, referencia_normativa, nivel_dificultad, estado, imagen_url, audio_url)
         VALUES ($1,$2,$3,$4,$5,'aprobada',$6,$7) RETURNING id`,
        [item.temaId, item.enunciado, item.explicacion ?? '', item.referenciaNormativa ?? null, item.nivelDificultad, item.imagenUrl ?? null, item.audioUrl ?? null],
      );
      for (const option of item.opciones) await client.query('INSERT INTO opciones_respuesta (pregunta_id, texto, correcta) VALUES ($1,$2,$3)', [pregunta.rows[0].id, option.texto, option.correcta]);
      for (const yearId of yearIds) {
        await client.query('INSERT INTO preguntas_anios_oficiales (pregunta_id, oposicion_anio_id) VALUES ($1, $2)', [pregunta.rows[0].id, yearId]);
      }
      for (const examId of [...new Set(examIds.map(String))]) {
        await client.query('INSERT INTO examenes_oficiales_preguntas (examen_id, pregunta_id) VALUES ($1, $2)', [examId, pregunta.rows[0].id]);
      }
      imported += 1;
    }
    await client.query('COMMIT');
    return { totalRows: lines.length - 1, imported, failed: 0, errors: [], oposicionId, anioIds: yearIds, examenIds: examIds };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
