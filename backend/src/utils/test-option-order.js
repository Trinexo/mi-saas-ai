export function fisherYates(values, random = Math.random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const candidate = Math.floor(random() * (index + 1));
    [result[index], result[candidate]] = [result[candidate], result[index]];
  }
  return result;
}

export function orderOptions(options = [], orderedIds = null) {
  if (!Array.isArray(orderedIds)) return options;
  const byId = new Map(options.map((option) => [String(option.id), option]));
  return orderedIds.map((id) => byId.get(String(id))).filter(Boolean);
}
