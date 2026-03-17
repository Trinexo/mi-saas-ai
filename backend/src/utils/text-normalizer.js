const MOJIBAKE_PATTERN = /[ÃÂâ]|\uFFFD/;

const DIRECT_REPLACEMENTS = new Map([
  ['Â¿', '¿'],
  ['Â¡', '¡'],
  ['Ã¡', 'á'],
  ['Ã©', 'é'],
  ['Ã­', 'í'],
  ['Ã³', 'ó'],
  ['Ãº', 'ú'],
  ['Ã', 'Á'],
  ['Ã‰', 'É'],
  ['Ã', 'Í'],
  ['Ã“', 'Ó'],
  ['Ãš', 'Ú'],
  ['Ã±', 'ñ'],
  ['Ã‘', 'Ñ'],
  ['Ã¼', 'ü'],
  ['Ãœ', 'Ü'],
  ['MonarquÃa', 'Monarquía'],
  ['jurÃdico', 'jurídico'],
  ['polÃtico', 'político'],
  ['soberanÃa', 'soberanía'],
  ['ci�n', 'ción'],
  ['Ci�n', 'Ción'],
  ['a�o', 'año'],
  ['A�o', 'Año'],
]);

const applyDirectReplacements = (value) => {
  let normalized = value;

  for (const [searchValue, replaceValue] of DIRECT_REPLACEMENTS) {
    normalized = normalized.replaceAll(searchValue, replaceValue);
  }

  return normalized;
};

const getEncodingNoiseScore = (value) => {
  if (typeof value !== 'string' || !value) {
    return 0;
  }

  const noiseMatches = value.match(/[ÃÂâ]/g) ?? [];
  const replacementMatches = value.match(/\uFFFD/g) ?? [];
  return noiseMatches.length * 2 + replacementMatches.length * 3;
};

const repairLatin1Mojibake = (value) => {
  if (typeof value !== 'string' || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  const directlyRepaired = applyDirectReplacements(value);
  if (getEncodingNoiseScore(directlyRepaired) < getEncodingNoiseScore(value)) {
    value = directlyRepaired;
  }

  try {
    const repaired = Buffer.from(value, 'latin1').toString('utf8');

    if (!repaired) {
      return value;
    }

    return getEncodingNoiseScore(repaired) < getEncodingNoiseScore(value) ? repaired : value;
  } catch {
    return value;
  }
};

export const normalizeTextContent = (value) => {
  if (typeof value === 'string') {
    return repairLatin1Mojibake(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeTextContent(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeTextContent(item)]));
  }

  return value;
};