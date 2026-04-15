export const adminPreguntasImportCsvMapperService = {
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