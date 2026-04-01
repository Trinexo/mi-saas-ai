import pool from '../config/db.js';
import { ApiError } from '../utils/api-error.js';
import { adminRepository } from '../repositories/admin.repository.js';
import { createPreguntaSchema } from '../schemas/admin.schema.js';

const normalizeHeader = (value) => value.trim().toLowerCase();

const parseCsvLine = (line, delimiter) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const requiredHeaders = [
  'tema_id',
  'enunciado',
  'explicacion',
  'referencia_normativa',
  'nivel_dificultad',
  'opcion_1',
  'opcion_2',
  'opcion_3',
  'opcion_4',
  'opcion_correcta',
];

export const adminPreguntasImportService = {
  async importPreguntasCsv(payload) {
    const delimiter = payload.delimiter || ',';
    const lines = payload.csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new ApiError(400, 'CSV sin datos para importar');
    }

    const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

    if (missingHeaders.length > 0) {
      throw new ApiError(400, `Faltan columnas obligatorias: ${missingHeaders.join(', ')}`);
    }

    const indexes = Object.fromEntries(headers.map((header, index) => [header, index]));
    const errors = [];
    let inserted = 0;

    for (let index = 1; index < lines.length; index += 1) {
      const line = lines[index];
      const values = parseCsvLine(line, delimiter);
      const rowNumber = index + 1;

      try {
        const correctOption = Number(values[indexes.opcion_correcta]);
        const item = {
          temaId: Number(values[indexes.tema_id]),
          enunciado: values[indexes.enunciado],
          explicacion: values[indexes.explicacion],
          referenciaNormativa: values[indexes.referencia_normativa] || null,
          nivelDificultad: Number(values[indexes.nivel_dificultad]),
          opciones: [1, 2, 3, 4].map((optionIndex) => ({
            texto: values[indexes[`opcion_${optionIndex}`]],
            correcta: optionIndex === correctOption,
          })),
        };

        const parsed = createPreguntaSchema.safeParse(item);
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          throw new Error(issue?.message || 'Fila inválida');
        }

        const temaExists = await adminRepository.existsTema(item.temaId);
        if (!temaExists) {
          throw new Error(`Tema ${item.temaId} no existe`);
        }

        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const pregunta = await adminRepository.createPregunta(client, parsed.data);
          await adminRepository.createOpciones(client, pregunta.id, parsed.data.opciones);
          await client.query('COMMIT');
          inserted += 1;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
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
