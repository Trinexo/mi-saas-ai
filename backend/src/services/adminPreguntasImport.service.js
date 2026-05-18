import { ApiError } from '../utils/api-error.js';
import pool from '../config/db.js';
import { createPreguntaSchema } from '../schemas/admin.schema.js';
import { adminPreguntasImportCsvService } from './adminPreguntasImportCsv.service.js';
import { adminPreguntasImportPersistService } from './adminPreguntasImportPersist.service.js';

export const adminPreguntasImportService = {
  async importPreguntasCsv(payload, caller = {}) {
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
