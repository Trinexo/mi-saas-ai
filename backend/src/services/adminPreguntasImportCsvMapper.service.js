export const adminPreguntasImportCsvMapperService = {
  buildItem(values, indexes) {
    const rawOpciones = [1, 2, 3, 4]
      .filter((n) => indexes[`opcion_${n}`] !== undefined)
      .map((n) => ({
        raw: values[indexes[`opcion_${n}`]] ?? '',
      }))
      .filter((opcion) => opcion.raw.trim() !== '');

    const correctaCount = rawOpciones.filter((o) => o.raw.startsWith('*')).length;

    if (correctaCount === 0) {
      throw new Error('Ninguna opción tiene el prefijo * para indicar la correcta');
    }
    if (correctaCount > 1) {
      throw new Error('Solo una opción puede tener el prefijo *');
    }

    return {
      temaId: Number(values[indexes.tema_id]),
      coleccionId: indexes.coleccion_id !== undefined && values[indexes.coleccion_id]
        ? Number(values[indexes.coleccion_id])
        : null,
      enunciado: values[indexes.enunciado],
      explicacion: values[indexes.explicacion],
      referenciaNormativa: values[indexes.referencia_normativa] || null,
      nivelDificultad: (() => {
        const raw = String(values[indexes.nivel_dificultad] ?? '').trim().toLowerCase();
        const map = { '1': 'facil', '2': 'facil', '3': 'media', '4': 'dificil', '5': 'dificil', facil: 'facil', fácil: 'facil', media: 'media', dificil: 'dificil', difícil: 'dificil' };
        return map[raw] ?? 'media';
      })(),
      opciones: rawOpciones.map((o, index) => ({
        texto: o.raw.startsWith('*') ? o.raw.slice(1).trim() : o.raw,
        correcta: o.raw.startsWith('*'),
      })),
    };
  },
};
