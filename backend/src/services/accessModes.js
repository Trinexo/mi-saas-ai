export const ACCESS_MODES = Object.freeze(['experto', 'guiado']);
export const DEFAULT_OPPOSITION_MODES = Object.freeze(['experto', 'guiado']);

export function normalizeModes(value, fallback = DEFAULT_OPPOSITION_MODES) {
  const source = value === undefined || value === null ? fallback : value;
  const result = [];
  for (const mode of ACCESS_MODES) {
    if (source.includes(mode)) result.push(mode);
  }
  if (!result.length || result.length !== new Set(source).size
    || source.some((mode) => !ACCESS_MODES.includes(mode))) {
    throw new Error('Configuración de modos inválida');
  }
  return result;
}

export function effectiveModes(oppositionModes, accessModes) {
  const allowed = normalizeModes(oppositionModes);
  const assigned = normalizeModes(accessModes);
  return ACCESS_MODES.filter((mode) => allowed.includes(mode) && assigned.includes(mode));
}
