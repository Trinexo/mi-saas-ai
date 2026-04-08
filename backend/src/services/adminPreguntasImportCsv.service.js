import { ApiError } from '../utils/api-error.js';

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

export const adminPreguntasImportCsvService = {
  parseCsvPayload(payload) {
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
    return { delimiter, lines, indexes };
  },

  parseRow(line, delimiter) {
    return parseCsvLine(line, delimiter);
  },

  buildItem(values, indexes) {
    const correctOption = Number(values[indexes.opcion_correcta]);

    return {
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
  },
};
