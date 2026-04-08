import { ApiError } from '../utils/api-error.js';
import { createPreguntaSchema } from '../schemas/admin.schema.js';
import { adminPreguntasImportCsvService } from './adminPreguntasImportCsv.service.js';
import { adminPreguntasImportPersistService } from './adminPreguntasImportPersist.service.js';

export const adminPreguntasImportService = {
  async importPreguntasCsv(payload) {
    const { delimiter, lines, indexes } = adminPreguntasImportCsvService.parseCsvPayload(payload);
    const errors = [];
    let inserted = 0;

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

        await adminPreguntasImportPersistService.insertPreguntaConOpciones(parsed.data);
        inserted += 1;
      } catch (error) {
        errors.push({ row: rowNumber, message: error.message });
      }
    }

    return {
      totalRows: lines.length - 1,
      imported: inserted,
      failed: errors.length,
      errors,
    };
  },
};
